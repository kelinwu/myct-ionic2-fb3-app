import { Component, OnInit } from '@angular/core';
import { NavController, Platform,ModalController } from 'ionic-angular';
import { AngularFire,FirebaseListObservable } from 'angularfire2';
import { CorpModalPage } from '../modal/corp/corpModal';

@Component({
  templateUrl: 'build/pages/corp/corp.html',
})
export class CorpPage {

  corpData:any;
  authUserId: string;
  corpInfo: FirebaseListObservable<any[]>;
  firebaseJsonRoutePath: string;
  logoCollection:any;
  constructor(
    private navCtrl: NavController,
    private af:AngularFire, 
    private modalCtrl: ModalController,
    platform: Platform) {
  }

  ngOnInit() {
    this.authUserId = firebase.auth().currentUser.uid;
    // this.corpData = { corp: {},mainContact:{}};
    this.corpInfo = this.af.database.list(this.authUserId + '/corp');
    this.firebaseJsonRoutePath = this.authUserId+'/logo';
    this.loadLogoObj();
  }

  edit(corpInfo) {
    let modal = this.modalCtrl.create(CorpModalPage, corpInfo);
    modal.present();
  }

 //load logo objectArray from firebase storage
  loadLogoObj() {

    firebase.database().ref(this.firebaseJsonRoutePath)
      .on('value', (_snapshot: any) => {
        var result = [];
        _snapshot.forEach((_childSnapshot) => {
          var elemnt = _childSnapshot.val();
          //elemnt.id = _childSnapshot.key;
          result.push(elemnt);
        });

        //push to collection arry to disp
        this.logoCollection = [{ URL: result[0] }];
      });
  }

}
