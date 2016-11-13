import { Component, OnInit } from '@angular/core';
import { NavController, ViewController,NavParams } from 'ionic-angular';
import { FirebaseListObservable, AngularFire } from 'angularfire2';

@Component({
  templateUrl: 'build/pages/modal/customer/customerModal.html',
})
export class CustomerModalPage {
  formInit = {
    customerName: ''
  }
  authUserId: string;
  customers: FirebaseListObservable<any[]>;
  isNew:boolean; 
  isUpdate:boolean;

  constructor(
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private af: AngularFire) {
  }

  ngOnInit() {
    this.authUserId = firebase.auth().currentUser.uid;
    this.customers = this.af.database.list(this.authUserId + '/customer');
    if(this.navParams.data.companyName !==undefined) {
      this.isUpdate = true;
      this.isNew = false;
    } else {
      this.isUpdate = false;
      this.isNew = true;
    }
    this.formInit = this.navParams.data;
  }
  //save to fb
  add(customerModel) {
    this.customers = this.af.database.list(this.authUserId + '/customer');
    customerModel.lastUpdated = new Date().getTime();

    this.customers.push(customerModel);
    this.dismiss();
  }

  //update
  update(customerModel){
    this.customers.update(this.navParams.data.$key, customerModel);
    this.dismiss();
  }

  //close modal window
  dismiss() {
    this.viewCtrl.dismiss();
  }
}
