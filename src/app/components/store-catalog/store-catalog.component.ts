//TEST STORE ID = 2HWV3WYwqUzasmLDGYfB

//ANGULAR
import { Component, OnInit } from "@angular/core";
import { debounceTime, map, startWith } from "rxjs/operators";

//COMPONENTS
import { CheckoutModalComponent } from "../checkout-modal/checkout-modal.component";

//MATERIAL
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";

//SERVICES
import { CatalogService } from "src/app/services/catalog/catalog.service";
import { StoreService } from "src/app/services/store/store.service";
import { AngularFireStorage } from "@angular/fire/storage";

//MODELS
import { StoreModel } from "src/app/models/store/store.model";
import { CartItemModel } from "../../models/cartItem/cartItem.model";
import { CatalogItemModel } from "../../models/catalogItem/catalogItem.model";
import { FormControl } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-store-catalog",
  templateUrl: "./store-catalog.component.html",
  styleUrls: ["./store-catalog.component.scss"],
})
export class StoreCatalogComponent implements OnInit {
  //STORE
  store: StoreModel = new StoreModel();
  storeLoading: boolean = true;
  selectedStoreId: string;

  //CHECKOUT
  checkoutValue: number;
  checkoutValueOutput: string;

  //CART
  cartList = Array<CartItemModel>();
  cartIsEmpty: boolean = true;

  //CATALOG LIST
  catalogList = Array<CatalogItemModel>();
  catalogListFiltered = Array<CatalogItemModel>();
  catalogListLoading: boolean = true;
  catalogListFilterControl = new FormControl();
  catalogListCategories: Array<string> = [];
  catalogListCategoriesFiltered: Array<string> = [];

  constructor(
    public dialog: MatDialog,
    private _catalogService: CatalogService,
    private _storeService: StoreService,
    private _route: ActivatedRoute,
    private _storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    this._route.paramMap.subscribe((param) => {
      this.selectedStoreId = param.get("id");
      this.getStoreInfo();
      this.getCatalogItensOfStore();
      this.setCatalogFilter();
    });
  }

  getStoreInfo(): void {
    this._storeService.getStore(this.selectedStoreId).subscribe((storeSnapshot) => {
      this.store = StoreModel.fromFirestoreSnapshot(storeSnapshot);
      this.storeLoading = false;
      this._storage.ref(this.store.logo).getDownloadURL().subscribe(url =>{
        this.store.logoUrl = url
      })
    });
    
  }

  getCatalogItensOfStore(): void {
    this._catalogService
      .getCatalogItensOfStore(this.selectedStoreId)
      .subscribe((catalogListSnapshot) => {
        if (!catalogListSnapshot.empty) {
          catalogListSnapshot.forEach((catalogItemSnapshot) => {
            let catalogItem: CatalogItemModel = CatalogItemModel.fromFirestoreSnapshot(
              catalogItemSnapshot
            );
            this._storage
              .ref(catalogItem.picture)
              .getDownloadURL()
              .subscribe((url) => {
                catalogItem.pictureUrl = url;
              });
            this.catalogList.push(catalogItem);
          });
          this.catalogListLoading = false;
          this.catalogListFiltered = this.catalogList;
          this.getCategoriesList();
        }
      });
  }

  getCategoriesList() {
    this.catalogListCategoriesFiltered = this.catalogListFiltered
      .map((catalogItem) => catalogItem.category)
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  openCheckoutModal(): void {
    const dialogRef = this.dialog.open(CheckoutModalComponent, {
      data: {
        cartList: this.cartList,
        whatsAppLink: this.createWhatsAppLink(),
        cartTotalValue: this.calculateTotalValue(),
      },
    });
  }

  handleQuantityChanges(event, id: string): void {
    let newItemQuantity: number = parseInt(event.target.value);
    if (newItemQuantity < 0) {
      newItemQuantity = 0;
    }
    let selectedItemCatalogId: string = id;
    let newCartItem: CartItemModel = this.newCartItemByCatalogId(selectedItemCatalogId);

    newCartItem.quantity = newItemQuantity;

    this.addItemToCart(newCartItem);
    this.updateCheckoutValue();
    this.btnCheckoutVisibility();
  }

  newCartItemByCatalogId(catalogId: string): CartItemModel {
    let catalogItem: CatalogItemModel = this.catalogList.find((item) => item.id == catalogId);
    let newCartItem: CartItemModel;
    newCartItem = {
      name: catalogItem.name,
      catalogId: catalogItem.id,
      value: catalogItem.value,
      quantity: 0,
      pictureUrl: catalogItem.pictureUrl,
    };
    return newCartItem;
  }

  updateCheckoutValue(): void {
    let checkoutValue: number = 0;
    this.cartList.forEach((cartItem) => {
      checkoutValue += cartItem.quantity * cartItem.value;
    });
    if (this.cartList.length) {
      this.checkoutValueOutput = ` ($${checkoutValue})`;
      return;
    }
    this.checkoutValueOutput = "";
    return;
  }

  addItemToCart(cartItem: CartItemModel): void {
    if (cartItem.quantity == 0) {
      this.removeItemFromCart(cartItem);
      return;
    }
    let cartItemAlreadyExists: boolean = this.cartList.some(
      (item) => item.catalogId == cartItem.catalogId
    );
    if (cartItemAlreadyExists) {
      let cartItemOnList: CartItemModel = this.cartList.find(
        (item) => item.catalogId == cartItem.catalogId
      );
      cartItemOnList.quantity = cartItem.quantity;
    } else {
      this.cartList.push(cartItem);
    }

    this.catalogListFiltered.find((item) => item.id == cartItem.catalogId).quantity =
      cartItem.quantity;

    return;
  }

  removeItemFromCart(cartItem: CartItemModel): void {
    this.cartList.splice(this.cartList.findIndex((item) => item.catalogId == cartItem.catalogId));
    return;
  }

  btnCheckoutVisibility(): void {
    if (this.cartList.length) {
      this.cartIsEmpty = false;
      return;
    }

    this.cartIsEmpty = true;
    return;
  }

  createWhatsAppLink(): string {
    let whatsAppLink: string;
    let storeNameFormated: string = this.store.name.split(" ").join("%20");
    let messageText: string = `Pedido%20da%20loja%20${storeNameFormated}%0D%0A%0D%0A`;
    this.cartList.forEach((cartItem) => {
      messageText += `${cartItem.quantity}%20x%20${cartItem.name}%20=>%20R$%20${cartItem.value}%0D%0A`;
    });
    messageText += `%0D%0ATOTAL%20=>%20${this.calculateTotalValue()}`;
    whatsAppLink = `https://wa.me/${this.store.phone}?text=${messageText}`;
    return whatsAppLink;
  }

  calculateTotalValue(): number {
    let cartTotalValue: number = 0;
    this.cartList.forEach((cartItem) => {
      cartTotalValue += cartItem.value * cartItem.quantity;
    });
    return cartTotalValue;
  }

  setCatalogFilter(): void {
    this.catalogListFilterControl.valueChanges.pipe(debounceTime(100)).subscribe((filterValue) => {
      this.catalogListFiltered = this.catalogList.filter((listItem) => {
        return listItem.name.toLowerCase().includes(filterValue.toLowerCase());
      });
      this.getCategoriesList();
    });
  }

  getCatalogListFilteredByCategory(category: string): CatalogItemModel[] {
    return this.catalogListFiltered.filter((item) => item.category == category);
  }
}
