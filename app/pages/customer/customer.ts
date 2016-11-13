import { Component, OnInit } from '@angular/core';
import { NavController, ModalController, ViewController, Nav } from 'ionic-angular';
import { FirebaseListObservable, AngularFire } from 'angularfire2';
import { CustomerModalPage } from '../modal/customer/customerModal';

@Component({
  templateUrl: 'build/pages/customer/customer.html',
})
export class CustomerPage {
  customers: FirebaseListObservable<any[]>;
  authUserId: string;
  constructor(
    private navCtrl: NavController,
    private af: AngularFire,
    private viewCtrl: ViewController,
    private modalCtrl: ModalController) {
  }

  ngOnInit() {
    this.authUserId = firebase.auth().currentUser.uid;
    this.customers = this.af.database.list(this.authUserId + '/customer');
    // console.log(this.customers);
  }

  presentModal(option) {
    let modal = this.modalCtrl.create(CustomerModalPage, option);
    modal.present();
  }

  edit(item) {
    let modal = this.modalCtrl.create(CustomerModalPage, item);
    modal.present(modal);
  }

  remove(item) {
    this.customers.remove(item);
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
