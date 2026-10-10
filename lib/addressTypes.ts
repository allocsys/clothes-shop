// Shared by the server (lib/addresses.ts) and the browser (components/AddressBook.tsx): no database code here.
export const ADDRESS_LIMIT = 10;

export type SavedAddress = {
  id: number;
  title: string;
  city: string;
  postalCode: string;
  address: string;
  isDefault: boolean;
};
