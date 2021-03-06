import { CatalogItemModel } from "../catalogItem/catalogItem.model";

export class StoreModel {
  id: string;
  name: string;
  description: string;
  adress: string;
  catalogList: Array<CatalogItemModel>;
  phone: number;
  logo: string;
  logoUrl: string;
  category: string;

  static fromFirestoreSnapshot(snapshot) {
    const store = new StoreModel();
    store.name = snapshot.get("name");
    store.description = snapshot.get("description");
    store.adress = snapshot.get("adress");
    store.phone = snapshot.get("phone");
    store.id = snapshot.id;
    store.logo = snapshot.get("logo");
    store.category = snapshot.get("category");

    return store;
  }
}
