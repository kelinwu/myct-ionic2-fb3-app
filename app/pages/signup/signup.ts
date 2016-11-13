import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController } from 'ionic-angular';
import { FirebaseAuth } from 'angularfire2';
import { LoginPage } from '../login/login';
import { FormGroup, Validators, FormBuilder,AbstractControl  } from '@angular/forms';
// import { ControlGroup, FormBuilder, Validators } from '@angular/common';

// function passwordMatcher(c: AbstractControl){
//   return c.get('password').value === c.get('confirm').value
// };

@Component({
  templateUrl: 'build/pages/signup/signup.html',
})
export class SignupPage {
  mySignup = {};
  loader: any;
  fiscal: number;
  authUserId: string;
  form: FormGroup;

  constructor(private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    public fb: FormBuilder,
    private auth: FirebaseAuth) {

    this.form = this.fb.group({
      "email": ['',Validators.required],
      "password": ['',Validators.required]
    });

  }

  public register() {
    var credentials:any = this.form.value;
    this.showLoading();
    this.auth.createUser(credentials).then((authData) => {
      this.loader.dismiss();
      let prompt = this.alertCtrl.create({
        title: 'Success',
        subTitle: 'Your new account was created',
        buttons: ['Okay']
      });

      //init corp,catgory
      this.initCorp(0);  //0 is canada

      this.navCtrl.setRoot(LoginPage)
    })
  }

  initCorp(countryCode) {
    //init categories
    var CategoryList = [
      {
        default: [  //canada list
          { code: 8523, name: 'Meal and entertainment' },
          { code: 8811, name: 'Office expenses and supplies' },
          { code: 8910, name: 'Car and truck expenses' },
          { code: 9001, name: 'Contractors' },
          { code: 8876, name: 'Educations and training' },
          { code: 8620, name: 'Employee benefits' },
          { code: 8862, name: 'Professional servicees' },
          { code: 8910, name: 'Rent or lease' },
          { code: 9130, name: 'Supplies' },
          { code: 9200, name: 'Travel expenses' },
          { code: 9220, name: 'Utilities' },
          { code: 9270, name: 'Other expenses' }
        ]
      }, {         //us list
        default: [
          { code: 8523, name: 'Meal and entertainment' },
          { code: 8811, name: 'Office expenses and supplies' },
          { code: 8910, name: 'Car and truck expenses' },
          { code: 9001, name: 'Contractors' },
          { code: 8876, name: 'Educations and training' },
          { code: 8620, name: 'Employee benefits' },
          { code: 8862, name: 'Professional servicees' },
          { code: 8910, name: 'Rent or lease' },
          { code: 9130, name: 'Supplies' },
          { code: 9200, name: 'Travel expenses' },
          { code: 9220, name: 'Utilities' },
          { code: 9270, name: 'Other expenses' }
        ]
      }
    ];

    this.fiscal = new Date().getFullYear();
    this.authUserId = firebase.auth().currentUser.uid;
    var ref = firebase.database().ref(this.authUserId + '/category');

    for (var i = 0; i < CategoryList[countryCode].default.length; i++) {
      ref.push(CategoryList[countryCode].default[i]);
    }

    //init corp
    var refCorp = firebase.database().ref(this.authUserId + '/corp');
    refCorp.push({
      corp: {
        companyName: '',
        address: '',
        email: '',
        phone: '',
        fax: '',
        tax: ''
      },
      mainContact: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      }
    });
  }

  showLoading() {
    this.loader = this.loadingCtrl.create({
      content: 'loading...'
    });
    this.loader.present();
  }

}
