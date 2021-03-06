import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentSnapshot } from "@angular/fire/firestore";
import { CatalogItemModel } from "../../models/catalogItem/catalogItem.model";
import { StoreModel } from "../../models/store/store.model";

@Injectable({
  providedIn: "root",
})
export class CatalogService {
  constructor(private _firestore: AngularFirestore) {}

  getCatalogItensOfStore(storeId) {
    return this._firestore.collection("stores").doc(storeId).collection("catalogList").get();
  }
}
