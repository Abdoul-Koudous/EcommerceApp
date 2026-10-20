import { useContext } from "react";
import { StoreIdentityContext } from "./storeIdentity";

export function useStoreIdentity() {
  return useContext(StoreIdentityContext);
}
