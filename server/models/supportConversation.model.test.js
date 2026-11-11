import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import SupportConversationModel from "./supportConversation.model.js";

test("support message location is optional", () => {
  const userId = new mongoose.Types.ObjectId();
  const conversation = new SupportConversationModel({
    userId,
    subject: "Question",
    messages: [
      {
        sender: "customer",
        senderId: userId,
        text: "Bonjour",
      },
    ],
  });

  assert.equal(conversation.messages[0].location, undefined);
});
