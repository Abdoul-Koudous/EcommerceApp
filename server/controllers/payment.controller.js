import "../config/fedapay.js";
import { Transaction, Webhook } from "fedapay";
import crypto from "crypto";
import OrderModel from "../models/order.model.js";
import PaymentAttemptModel from "../models/paymentAttempt.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import AddressModel from "../models/address.model.js";
import UserModel from "../models/user.model.js";
import kkiapayClient from "../config/kkiapay.js";
import { calculateOrderTotals } from "../services/pricing.service.js";
import { decrementStock, restoreStock } from "../services/stock.service.js";
import { sendOrderReceiptEmail } from "../utils/mailer.js";
import {
  PAYMENT_METHODS,
  assertPaymentMethodEnabled,
} from "../services/settings.service.js";

// 📸 Résout une adresse du carnet de l'utilisateur et renvoie un snapshot
// prêt à être stocké tel quel dans order.delivery_address.
const resolveDeliverySnapshot = async (userId, addressId) => {
  const addressDoc = await AddressModel.findOne({ _id: addressId, userId });

  if (!addressDoc) {
    return null;
  }

  return {
    addressId: addressDoc._id,
    name: addressDoc.name,
    mobile: addressDoc.mobile,
    address_line1: addressDoc.address_line1,
    landmark: addressDoc.landmark,
    city: addressDoc.city,
    state: addressDoc.state,
    pincode: addressDoc.pincode,
    country: addressDoc.country,
    addressType: addressDoc.addressType,
  };
};

// ✅ Helper partagé pour transformer un item de panier en ligne de
// commande, en incluant la variante sélectionnée.
const mapCartItemToOrderProduct = (item) => ({
  productId: item.productId,
  productTitle: item.productTitle,
  image: item.image,
  price: item.price,
  quantity: item.quantity,
  selectedVariants: item.selectedVariants || {},
  selectedCombinationSku: item.selectedCombinationSku || "",
});

// ✅ AJOUT — envoi du reçu par email en arrière-plan, non-bloquant.
// N'importe quelle erreur (user introuvable, SMTP down, etc.) est
// avalée par le .catch() pour ne jamais faire échouer la réponse HTTP
// principale : la commande est déjà sauvegardée, c'est ce qui compte.
const dispatchOrderReceiptEmail = (userId, savedOrder) => {
  UserModel.findById(userId)
    .then((user) => {
      if (user?.email) {
        return sendOrderReceiptEmail(savedOrder, user.email);
      }
    })
    .catch((err) => console.error("Échec envoi email reçu:", err.message));
};

const assertTransactionAmount = (transaction, expectedAmount) => {
  const paidAmount = Number(transaction.amount);
  if (
    !Number.isFinite(paidAmount) ||
    paidAmount !== Math.round(expectedAmount)
  ) {
    const error = new Error(
      "Le montant payé ne correspond pas au total de la commande. Contactez le support avant de recommencer le paiement.",
    );
    error.status = 400;
    throw error;
  }
};

const isKkiapayTransactionSuccessful = (transaction) =>
  String(transaction?.status || "").trim().toUpperCase() === "SUCCESS";

const getKkiapayTransactionStatus = (transaction) =>
  String(transaction?.status || "").trim().toUpperCase();

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const retrieveKkiapayTransaction = async (transactionId) => {
  const maxAttempts = 6;
  const retryDelayMs = 2000;
  let transaction;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    transaction = await kkiapayClient.verify(transactionId);
    if (getKkiapayTransactionStatus(transaction) !== "PENDING") {
      return transaction;
    }
    if (attempt < maxAttempts) {
      await wait(retryDelayMs);
    }
  }

  console.warn("KkiaPay transaction status remained pending after retries:", {
    attempts: maxAttempts,
  });
  return transaction;
};

const findExistingPaymentOrder = async (
  userId,
  paymentProvider,
  paymentId,
  expectedAmount,
) => {
  const existing = await OrderModel.findOne({
    paymentId,
    $or: [
      { paymentProvider },
      { paymentProvider: { $exists: false } },
    ],
  });
  if (!existing) return null;
  if (String(existing.userId) !== String(userId)) {
    const error = new Error("Cette transaction a déjà été utilisée");
    error.status = 409;
    throw error;
  }
  if (expectedAmount !== undefined) {
    assertTransactionAmount({ amount: expectedAmount }, existing.totalAmt);
  }
  return existing;
};

const saveOrderWithReservedStock = async (order, products) => {
  await decrementStock(products);
  try {
    return await order.save();
  } catch (error) {
    try {
      await restoreStock(products);
    } catch (rollbackError) {
      console.error("Échec de restitution du stock après erreur de commande:", {
        orderId: order.orderId,
        saveError: error.message,
        rollbackError: rollbackError.message,
      });
      throw new AggregateError(
        [error, rollbackError],
        "La commande et le retour arrière du stock ont échoué",
      );
    }
    throw error;
  }
};

const savePaidOrder = async (
  order,
  products,
  userId,
  provider,
  paymentId,
  amount,
) => {
  try {
    return {
      order: await saveOrderWithReservedStock(order, products),
      alreadyCreated: false,
    };
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existingOrder = await findExistingPaymentOrder(
      userId,
      provider,
      paymentId,
      amount,
    );
    if (!existingOrder) throw error;
    return { order: existingOrder, alreadyCreated: true };
  }
};

const sendCreatedOrderResponse = async (
  req,
  res,
  order,
  message,
  sendReceipt = true,
) => {
  await CartProductModel.deleteMany({ userId: req.userId });
  if (sendReceipt) {
    dispatchOrderReceiptEmail(req.userId, order);
  }
  return res.status(200).json({
    error: false,
    success: true,
    message,
    data: order,
  });
};

export const createPaymentAttemptController = async (req, res) => {
  try {
    const { provider, addressId } = req.body;
    const normalizedProvider = String(provider || "").toLowerCase();

    if (!["fedapay", "kkiapay"].includes(normalizedProvider) || !addressId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Un fournisseur de paiement et une adresse sont requis",
      });
    }

    await assertPaymentMethodEnabled(
      normalizedProvider === "fedapay"
        ? PAYMENT_METHODS.FEDAPAY
        : PAYMENT_METHODS.KKIAPAY,
    );

    const deliveryAddress = await resolveDeliverySnapshot(
      req.userId,
      addressId,
    );
    if (!deliveryAddress) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Adresse de livraison introuvable",
      });
    }

    const cartItems = await CartProductModel.find({ userId: req.userId });
    if (cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le panier est vide",
      });
    }

    const { subTotalAmt, shippingAmt, taxAmt, totalAmt, pricedItems } =
      await calculateOrderTotals(cartItems, deliveryAddress.city);
    const reference = crypto.randomBytes(24).toString("hex");
    const attempt = await PaymentAttemptModel.create({
      reference,
      userId: req.userId,
      provider: normalizedProvider,
      deliveryAddress,
      cartItemIds: cartItems.map((item) => String(item._id)),
      products: pricedItems.map(mapCartItemToOrderProduct),
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return res.status(201).json({
      error: false,
      success: true,
      data: {
        reference: attempt.reference,
        amount: Math.round(attempt.totalAmt),
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: true,
      success: false,
      message: error.status
        ? error.message
        : "Impossible de préparer le paiement",
    });
  }
};

const completePaymentAttempt = async ({
  provider,
  reference,
  paymentId,
  transaction,
  userId,
}) => {
  const query = { provider, reference };
  if (userId) query.userId = userId;

  query.expiresAt = { $gt: new Date() };
  const attempt = await PaymentAttemptModel.findOne(query);
  if (!attempt) return null;

  if (attempt.status === "paid") {
    if (attempt.paymentId !== paymentId) {
      const error = new Error(
        "Cette tentative a déjà été réglée avec une autre transaction",
      );
      error.status = 409;
      throw error;
    }
    const order = await OrderModel.findOne({
      orderId: attempt.orderId,
      userId: attempt.userId,
    });
    if (!order) {
      throw new Error("La commande associée au paiement est introuvable");
    }
    return { order, alreadyCreated: true };
  }

  if (attempt.paymentId && attempt.paymentId !== paymentId) {
    const error = new Error(
      "Cette tentative a déjà été réglée avec une autre transaction",
    );
    error.status = 409;
    throw error;
  }

  assertTransactionAmount(transaction, attempt.totalAmt);

  const paymentClaim = await PaymentAttemptModel.updateOne(
    {
      _id: attempt._id,
      status: "pending",
      expiresAt: { $gt: new Date() },
      $or: [{ paymentId: "" }, { paymentId }],
    },
    { $set: { paymentId } },
  );
  if (paymentClaim.matchedCount === 0) {
    const latestAttempt = await PaymentAttemptModel.findById(attempt._id);
    if (
      latestAttempt?.status === "paid" &&
      latestAttempt.paymentId === paymentId
    ) {
      const order = await OrderModel.findOne({
        orderId: latestAttempt.orderId,
        userId: latestAttempt.userId,
      });
      if (!order) {
        throw new Error("La commande associée au paiement est introuvable");
      }
      return { order, alreadyCreated: true };
    }
    const error = new Error(
      "Cette tentative a déjà été associée à une autre transaction",
    );
    error.status = 409;
    throw error;
  }

  const existingOrder = await findExistingPaymentOrder(
    attempt.userId,
    provider,
    paymentId,
    transaction.amount,
  );
  if (existingOrder) {
    await PaymentAttemptModel.updateOne(
      { _id: attempt._id, status: "pending" },
      {
        $set: {
          status: "paid",
          paymentId,
          orderId: existingOrder.orderId,
        },
      },
    );
    return { order: existingOrder, alreadyCreated: true };
  }

  const order = new OrderModel({
    userId: attempt.userId,
    orderId: `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    products: attempt.products,
    paymentProvider: provider,
    paymentId,
    payment_status: "Payée",
    order_status: "Reçue",
    delivery_address: attempt.deliveryAddress,
    subTotalAmt: attempt.subTotalAmt,
    shippingAmt: attempt.shippingAmt,
    taxAmt: attempt.taxAmt,
    totalAmt: attempt.totalAmt,
  });

  const { order: savedOrder, alreadyCreated } = await savePaidOrder(
    order,
    attempt.products,
    attempt.userId,
    provider,
    paymentId,
    transaction.amount,
  );

  await PaymentAttemptModel.updateOne(
    { _id: attempt._id, status: "pending" },
    {
      $set: {
        status: "paid",
        paymentId,
        orderId: savedOrder.orderId,
      },
    },
  );

  await CartProductModel.deleteMany({
    _id: { $in: attempt.cartItemIds },
    userId: attempt.userId,
  });

  if (!alreadyCreated) {
    dispatchOrderReceiptEmail(attempt.userId, savedOrder);
  }

  return { order: savedOrder, alreadyCreated };
};

const sendPaymentAttemptResponse = async (
  req,
  res,
  provider,
  reference,
  paymentId,
  transaction,
) => {
  const result = await completePaymentAttempt({
    provider,
    reference,
    paymentId,
    transaction,
    userId: req.userId,
  });

  if (!result) {
    return res.status(404).json({
      error: true,
      success: false,
      message: "Tentative de paiement introuvable",
    });
  }

  return res.status(200).json({
    error: false,
    success: true,
    message: result.alreadyCreated
      ? "Cette commande a déjà été confirmée"
      : "Paiement confirmé, commande créée avec succès",
    data: result.order,
  });
};

const getFedaPayAttemptReference = (transaction) => {
  const prefix = "Commande #";
  if (
    typeof transaction.description !== "string" ||
    !transaction.description.startsWith(prefix)
  ) {
    return null;
  }
  return transaction.description.slice(prefix.length);
};

const constantTimeStringEqual = (provided, expected) => {
  if (typeof provided !== "string" || typeof expected !== "string") return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

export const fedapayWebhookController = async (req, res) => {
  const endpointSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!endpointSecret) {
    console.error("FEDAPAY_WEBHOOK_SECRET n'est pas configuré");
    return res.status(503).json({ received: false });
  }

  let event;
  try {
    if (!req.rawBody) {
      return res.status(400).json({ received: false });
    }
    event = Webhook.constructEvent(
      req.rawBody.toString("utf8"),
      req.headers["x-fedapay-signature"],
      endpointSecret,
    );
  } catch (error) {
    console.warn("Signature webhook FedaPay invalide:", error.message);
    return res.status(400).json({ received: false });
  }

  if (event.name !== "transaction.approved") {
    return res.status(200).json({ received: true });
  }

  try {
    if (!event.object_id) {
      console.warn("Événement FedaPay approuvé sans identifiant de transaction");
      return res.status(200).json({ received: true });
    }

    const transaction = await Transaction.retrieve(String(event.object_id));
    if (String(transaction.id) !== String(event.object_id)) {
      return res.status(200).json({ received: true });
    }
    if (transaction.status !== "approved") {
      throw new Error("La transaction FedaPay n'est pas encore approuvée");
    }

    const reference = getFedaPayAttemptReference(transaction);
    if (!reference) {
      console.warn("Webhook FedaPay approuvé sans référence de commande");
      return res.status(200).json({ received: true });
    }

    const result = await completePaymentAttempt({
      provider: "fedapay",
      reference,
      paymentId: String(transaction.id),
      transaction,
    });
    if (!result) {
      console.warn("Tentative FedaPay introuvable pour le webhook reçu");
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Échec du traitement du webhook FedaPay:", error.message);
    if ([400, 404, 409, 410].includes(error.status)) {
      return res.status(200).json({ received: true });
    }
    return res.status(500).json({ received: false });
  }
};

export const kkiapayWebhookController = async (req, res) => {
  const webhookSecret = process.env.KKIAPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("KKIAPAY_WEBHOOK_SECRET n'est pas configuré");
    return res.status(503).json({ received: false });
  }

  if (
    !constantTimeStringEqual(
      req.headers["x-kkiapay-secret"],
      webhookSecret,
    )
  ) {
    return res.status(401).json({ received: false });
  }

  const payload = req.body || {};
  if (
    payload.event !== "transaction.success" ||
    payload.isPaymentSucces !== true
  ) {
    return res.status(200).json({ received: true });
  }

  let stateData = payload.stateData ?? payload.data;
  if (typeof stateData === "string") {
    try {
      stateData = JSON.parse(stateData);
    } catch {
      // Some widget integrations return the merchant data as a plain string.
    }
  }
  const reference =
    typeof stateData === "string"
      ? stateData
      : stateData?.checkoutReference;
  const transactionId = payload.transactionId;
  if (!reference || !transactionId) {
    console.warn("Webhook KkiaPay sans référence de commande");
    return res.status(200).json({ received: true });
  }

  try {
    const transaction = await retrieveKkiapayTransaction(String(transactionId));
    const verifiedTransactionId =
      transaction?.transactionId ?? transaction?.id;
    if (
      verifiedTransactionId !== undefined &&
      verifiedTransactionId !== null &&
      String(verifiedTransactionId) !== String(transactionId)
    ) {
      return res.status(200).json({ received: true });
    }
    if (!isKkiapayTransactionSuccessful(transaction)) {
      if (getKkiapayTransactionStatus(transaction) === "PENDING") {
        throw new Error("La transaction KkiaPay est toujours en attente");
      }
      return res.status(200).json({ received: true });
    }

    const result = await completePaymentAttempt({
      provider: "kkiapay",
      reference: String(reference),
      paymentId: String(transactionId),
      transaction,
    });
    if (!result) {
      console.warn("Tentative KkiaPay introuvable pour le webhook reçu");
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Échec du traitement du webhook KkiaPay:", error.message);
    if ([400, 404, 409, 410].includes(error.status)) {
      return res.status(200).json({ received: true });
    }
    return res.status(500).json({ received: false });
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    await assertPaymentMethodEnabled(PAYMENT_METHODS.FEDAPAY);

    const userId = req.userId;
    const { transactionId, addressId, attemptReference } = req.body;

    if (!transactionId || (!addressId && !attemptReference)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "transactionId et addressId sont requis",
      });
    }

    const transaction = await Transaction.retrieve(transactionId);

    if (
      String(transaction.id) !== String(transactionId) ||
      transaction.status !== "approved"
    ) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le paiement n'a pas été approuvé",
      });
    }

    if (attemptReference) {
      return await sendPaymentAttemptResponse(
        req,
        res,
        "fedapay",
        String(attemptReference),
        String(transaction.id),
        transaction,
      );
    }

    const existingOrder = await findExistingPaymentOrder(
      userId,
      "fedapay",
      String(transaction.id),
      transaction.amount,
    );
    if (existingOrder) {
      return sendCreatedOrderResponse(
        req,
        res,
        existingOrder,
        "Cette commande a déjà été confirmée",
        false,
      );
    }

    const delivery_address = await resolveDeliverySnapshot(userId, addressId);

    if (!delivery_address) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Adresse de livraison introuvable",
      });
    }

    const cartItems = await CartProductModel.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le panier est vide",
      });
    }

    const { subTotalAmt, shippingAmt, taxAmt, totalAmt, pricedItems } =
      await calculateOrderTotals(cartItems, delivery_address.city);
    assertTransactionAmount(transaction, totalAmt);
    const products = pricedItems.map(mapCartItemToOrderProduct);

    const orderId = `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new OrderModel({
      userId,
      orderId,
      products,
      paymentProvider: "fedapay",
      paymentId: String(transaction.id),
      payment_status: "Payée",
      order_status: "Reçue",
      delivery_address,
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
    });

    const { order: savedOrder, alreadyCreated } = await savePaidOrder(
      order,
      products,
      userId,
      "fedapay",
      String(transaction.id),
      transaction.amount,
    );

    return sendCreatedOrderResponse(
      req,
      res,
      savedOrder,
      alreadyCreated
        ? "Cette commande a déjà été confirmée"
        : "Paiement confirmé, commande créée avec succès",
      !alreadyCreated,
    );
  } catch (error) {
    return res.status(error.status || 500).json({
      error: true,
      success: false,
      message: error.status
        ? error.message
        : "Erreur lors de la vérification du paiement",
      data: error.message,
    });
  }
};

export const verifyKkiapayPaymentController = async (req, res) => {
  try {
    await assertPaymentMethodEnabled(PAYMENT_METHODS.KKIAPAY);

    const userId = req.userId;
    const { transactionId, addressId, attemptReference } = req.body;

    if (!transactionId || (!addressId && !attemptReference)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "transactionId et addressId sont requis",
      });
    }

    const paymentId = String(transactionId);
    const transaction = await retrieveKkiapayTransaction(transactionId);

    const transactionStatus = getKkiapayTransactionStatus(transaction);

    if (transactionStatus === "PENDING") {
      return res.status(409).json({
        error: true,
        success: false,
        message:
          "KkiaPay indique que le paiement est encore en attente. Aucun reçu n'a été créé. En mode sandbox, utilisez le numéro de test de succès affiché dans le widget puis réessayez.",
      });
    }

    if (!isKkiapayTransactionSuccessful(transaction)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le paiement n'a pas été approuvé",
      });
    }

    if (attemptReference) {
      return await sendPaymentAttemptResponse(
        req,
        res,
        "kkiapay",
        String(attemptReference),
        paymentId,
        transaction,
      );
    }

    const existingOrder = await findExistingPaymentOrder(
      userId,
      "kkiapay",
      paymentId,
    );
    if (existingOrder) {
      return sendCreatedOrderResponse(
        req,
        res,
        existingOrder,
        "Cette commande a déjà été confirmée",
        false,
      );
    }

    const delivery_address = await resolveDeliverySnapshot(userId, addressId);

    if (!delivery_address) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Adresse de livraison introuvable",
      });
    }

    const cartItems = await CartProductModel.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le panier est vide",
      });
    }

    const { subTotalAmt, shippingAmt, taxAmt, totalAmt, pricedItems } =
      await calculateOrderTotals(cartItems, delivery_address.city);
    assertTransactionAmount(transaction, totalAmt);
    const products = pricedItems.map(mapCartItemToOrderProduct);

    const orderId = `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new OrderModel({
      userId,
      orderId,
      products,
      paymentProvider: "kkiapay",
      paymentId,
      payment_status: "Payée",
      order_status: "Reçue",
      delivery_address,
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
    });

    const { order: savedOrder, alreadyCreated } = await savePaidOrder(
      order,
      products,
      userId,
      "kkiapay",
      paymentId,
      transaction.amount,
    );

    return sendCreatedOrderResponse(
      req,
      res,
      savedOrder,
      alreadyCreated
        ? "Cette commande a déjà été confirmée"
        : "Paiement confirmé, commande créée avec succès",
      !alreadyCreated,
    );
  } catch (error) {
    return res.status(error.status || 500).json({
      error: true,
      success: false,
      message: error.status
        ? error.message
        : "Erreur lors de la vérification du paiement KkiaPay",
      data: error.message,
    });
  }
};

export const createCashOnDeliveryOrder = async (req, res) => {
  try {
    await assertPaymentMethodEnabled(PAYMENT_METHODS.CASH_ON_DELIVERY);

    const userId = req.userId;
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "addressId est requis",
      });
    }

    const delivery_address = await resolveDeliverySnapshot(userId, addressId);

    if (!delivery_address) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Adresse de livraison introuvable",
      });
    }

    const cartItems = await CartProductModel.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le panier est vide",
      });
    }

    const { subTotalAmt, shippingAmt, taxAmt, totalAmt, pricedItems } =
      await calculateOrderTotals(cartItems, delivery_address.city);
    const products = pricedItems.map(mapCartItemToOrderProduct);

    const orderId = `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new OrderModel({
      userId,
      orderId,
      products,
      paymentId: null,
      payment_status: "À payer à la livraison",
      order_status: "Reçue",
      delivery_address,
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
    });

    // 📉 Décrémenter le stock (commande ferme, même si paiement différé) —
    // ⚠️ le stock est bien retiré immédiatement à la commande, PAS à la
    // livraison. Ce qui change avec notre correction, c'est uniquement le
    // moment où l'event PURCHASE compte dans les Analytics (confirmed:
    // false ici, confirmé plus tard côté order.controller.js quand
    // order_status passe à "Livrée"). Le stock, lui, reste réservé dès la
    // commande — cohérent avec "commande ferme" même si le paiement est différé.
    const savedOrder = await saveOrderWithReservedStock(order, products);

    return sendCreatedOrderResponse(
      req,
      res,
      savedOrder,
      "Commande créée avec succès. Vous paierez à la livraison.",
    );
  } catch (error) {
    return res.status(error.status || 500).json({
      error: true,
      success: false,
      message: error.status
        ? error.message
        : "Erreur lors de la création de la commande",
      data: error.message,
    });
  }
};

export const getOrderPreviewController = async (req, res) => {
  try {
    const { city } = req.query;

    // ✅ MODIFIÉ : supporte le panier invité, comme cart.controller.js —
    // sinon le total reste à 0 pour un visiteur non connecté.
    const ownerFilter = req.userId
      ? { userId: req.userId }
      : req.query.guestSessionId
        ? { guestSessionId: req.query.guestSessionId }
        : null;

    if (!ownerFilter) {
      return res.status(200).json({
        error: false,
        success: true,
        subTotalAmt: 0,
        shippingAmt: 0,
        taxAmt: 0,
        totalAmt: 0,
        currency: "FCFA",
      });
    }

    const cartItems = await CartProductModel.find(ownerFilter);

    if (!cartItems || cartItems.length === 0) {
      return res.status(200).json({
        error: false,
        success: true,
        subTotalAmt: 0,
        shippingAmt: 0,
        taxAmt: 0,
        totalAmt: 0,
        currency: "FCFA",
      });
    }

    const totals = await calculateOrderTotals(cartItems, city);

    return res.status(200).json({
      error: false,
      success: true,
      subTotalAmt: totals.subTotalAmt,
      shippingAmt: totals.shippingAmt,
      taxAmt: totals.taxAmt,
      totalAmt: totals.totalAmt,
      currency: totals.currency,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: true,
      success: false,
      message: error.status
        ? error.message
        : "Erreur lors du calcul du total",
      data: error.message,
    });
  }
};