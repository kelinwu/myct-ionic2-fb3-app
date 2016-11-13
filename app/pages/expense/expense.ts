import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, Platform, ModalController,NavParams } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { ExpenseModalPage } from '../modal/expense/ExpenseModal';
import * as moment from 'moment';

@Component({
  templateUrl: 'build/pages/expense/expense.html',
})

export class ExpensePage {
  expenses: FirebaseListObservable<any[]>;
  authUserId: any;
  fiscal: number;
  firebaseJsonRoutePath: string;
  expenseYTDTotal;
  selectedItem:any;
  constructor(private navCtrl: NavController,
    private af: AngularFire,
    private alertCtrl: AlertController,
    private platform: Platform,
    navPrams:NavParams,
    private modalCtrl: ModalController) {
      this.selectedItem = navPrams.get('item');
  }

  ngOnInit() {
    this.fiscal = new Date().getFullYear();
    this.authUserId = firebase.auth().currentUser.uid;
    this.firebaseJsonRoutePath = this.authUserId + '/' + this.fiscal;
    this.expenses = this.af.database.list(this.firebaseJsonRoutePath + '/expense');
    this.expenseYTDTotal = {
      total: 0, tax: 0
    }

    firebase.database().ref(this.firebaseJsonRoutePath + '/expense').orderByChild('lastUpdated')
      .on('value', (_snapshot: any) => {
        var _total = 0, _tax = 0;
        _snapshot.forEach((_childSnapshot) => {
          _total += Number(_childSnapshot.val().expenseSubtotal);
          _tax += Number(_childSnapshot.val().tax);
        });

        this.expenseYTDTotal = {
          total: _total.toFixed(2),
          tax: _tax.toFixed(2)
        }
      })
  }

  presentModal(obj) {
    let modal = this.modalCtrl.create(ExpenseModalPage, obj);
    modal.present(modal);
  }

  public remove(expense) {
    this.expenses.remove(expense);
  }
  public open(expense) {
    this.edit(expense, false);
  }

  // itemDetail(event,item){
  //   this.navCtrl.push(ExpenseDetailPage,{
  //     item:item
  //   })
  // }

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
              this.expenses.push({ 'expense': data.item });
            } else {
              this.expenses.update(expense, { expense: data.item });
            }
          }
        }

      ]
    });
    prompt.present();
  }
}
