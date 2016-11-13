import { Component, OnInit } from '@angular/core';
import { NavController, ModalController, ViewController, AlertController } from 'ionic-angular';
import { FirebaseListObservable, AngularFire } from 'angularfire2';
// import { CategoryModalPage } from '../modal/category/categoryModal';

@Component({
  templateUrl: 'build/pages/category/category.html',
})
export class CategoryPage {
  categories: FirebaseListObservable<any[]>;
  authUserId: string;

  constructor(
    private navCtrl: NavController,
    private af: AngularFire,
    private alertCtrl: AlertController,
    private viewCtrl: ViewController,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.authUserId = firebase.auth().currentUser.uid;
    this.categories = this.af.database.list(this.authUserId + '/category');
    // console.log(this.categories);
  }

  remove(category) {
    if (category.code === undefined)
      this.categories.remove(category);
  }


  create() {
    this.edit(null, true);
  }

  open(category) {
    this.edit(category, false);
  }

  edit(category, isNew: boolean) {
    let prompt = this.alertCtrl.create({
      title: isNew ? 'Create Category' : 'Update Category',
      inputs: [
        {
          name: 'name',
          placeholder: 'Category Name',
          value: category ? category.name : ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'Cancel'
        },
        {
          text: category ? 'Update' : 'Add',
          handler: data => {
            if (isNew) {
              this.categories.push({ 'name': data.name });
            } else {
              this.categories.update(category, { name: data.name });
            }
          }
        }

      ]
    });
    prompt.present();
  }

}
