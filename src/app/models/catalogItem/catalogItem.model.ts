export class CatalogItemModel {
  name: string
  description: string
  pictureUrl: string
  id: string
  value: number
  quantity: number

  static fromFirestoreSnapshot(snapshot){
    const catalogItem = new CatalogItemModel();
    catalogItem.name = snapshot.get("name");
    catalogItem.description = snapshot.get("description");
    catalogItem.pictureUrl = snapshot.get("pictureUrl");
    catalogItem.id = snapshot.id;
    catalogItem.value = snapshot.get("value");
    catalogItem.quantity = snapshot.get("quantity");

    return catalogItem;
  }
}
