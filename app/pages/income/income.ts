import { Component } from '@angular/core';
import { NavController, AlertController, Platform, ModalController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { IncomeModalPage } from '../modal/income/incomeModal';
import * as moment from 'moment';

@Component({
  templateUrl: 'build/pages/income/income.html',
})
export class IncomePage {

  incomes: FirebaseListObservable<any[]>;
  authUserId: any;
  fiscal: number;
  firebaseJsonRoutePath: string;
  incomeYTDTotal;

  constructor(private navCtrl: NavController,
    private af: AngularFire,
    private alertCtrl: AlertController,
    private platform: Platform,
    private modalCtrl: ModalController) {

  }
  ngOnInit() {
    this.fiscal = new Date().getFullYear();
    this.authUserId = firebase.auth().currentUser.uid;
    this.firebaseJsonRoutePath = this.authUserId + '/' + this.fiscal;
    this.incomes = this.af.database.list(this.firebaseJsonRoutePath + '/income');
    this.incomeYTDTotal = {
      total: 0, tax: 0
    }

    firebase.database().ref(this.firebaseJsonRoutePath + '/income')
      .on('value', (_snapshot: any) => {
        var _total = 0, _tax = 0;
        _snapshot.forEach((_childSnapshot) => {
          _total += Number(_childSnapshot.val().subtotal);
          _tax += Number(_childSnapshot.val().tax);
        });

        this.incomeYTDTotal = {
          total: _total.toFixed(2),
          tax: _tax.toFixed(2)
        }
      })
  }

  presentModal(incomeObj) {
    let modal = this.modalCtrl.create(IncomeModalPage, incomeObj);
    modal.present(incomeObj);
  }
  public remove(income) {
    this.incomes.remove(income);
  }
  public open(expense) {
    this.edit(expense, false);
  }

  edit(expense, isNew: boolean) {
    let prompt = this.alertCtrl.create({
      title: isNew ? 'Create Expense' : 'Update Expense',
      inputs: [{
        name: 'item',
        placeholder: 'item name',
        value: expense ? expense.expense : ''
      }],
      buttons: [{
        text: 'Cancel',
        role: 'Cancel'
      },
        {
          text: expense ? 'Update' : 'Add',
          hander: data => {
            if (isNew) {
              this.incomes.push({ 'expense': data.item });
            } else {
              this.incomes.update(expense, { expense: data.item });
            }
          }
        }

      ]
    });
    prompt.present();
  }
}
