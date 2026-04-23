import {
  useGetSavingsAccounts,
  useCreateSavingsAccount,
  useUpdateSavingsAccount,
} from "@/lib/api-client";

export function useSavingsAccounts() {
  return useGetSavingsAccounts();
}

export { useCreateSavingsAccount, useUpdateSavingsAccount };
