import { Component, OnInit } from '@angular/core';
import { NavController, Platform, ViewController, NavParams } from 'ionic-angular';
import { FirebaseListObservable, AngularFire } from 'angularfire2';
import { Camera } from 'ionic-native';
declare var window: any;

@Component({
  templateUrl: 'build/pages/modal/expense/expenseModal.html',
})

export class ExpenseModalPage {
  recieptCollection: any;
  segment;
  thisFiscal: number;
  categories: FirebaseListObservable<any[]>;
  formInit;
  authUserId: string;
  expenses: FirebaseListObservable<any[]>;
  receiptSerial: string;
  newReceiptSerial: string;
  receiptDownloadURL: string;
  firebaseJsonRoutePath: string;
  firebaseJsonRouteCategory: string;
  isNew: boolean;
  isUpdate: boolean;

  constructor(
    public platform: Platform,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private af: AngularFire
  ) {
  }

  ngOnInit() {

    this.segment = "expense";
    this.thisFiscal = new Date().getFullYear();
    this.authUserId = firebase.auth().currentUser.uid;
    this.receiptSerial = this.navParams.data.receiptSerial;
    this.newReceiptSerial = this.receiptSerial === undefined
      ? this.authUserId + Date.now() + Math.random().toString(36).slice(-8)
      : this.receiptSerial;
    this.firebaseJsonRoutePath = this.authUserId + '/' + this.thisFiscal;
    this.firebaseJsonRouteCategory = this.authUserId;
    // this.loadReceipt();

    this.categories = this.af.database.list(this.firebaseJsonRouteCategory + '/category');

    if (this.navParams.data.subtotal !== undefined) {
      this.isUpdate = true;
      this.isNew = false;
    } else {
      this.isUpdate = false;
      this.isNew = true;
    }

    this.formInit = (this.navParams.data.item === undefined) ? { selectedCategory: 'Meal and entertainment', taxable: true } : this.navParams.data;


    //load receipt photos
    this.loadReceipt();

    // selectedCategory: 1234,
    // taxable: true,
    // item: Math.random().toString(36).slice(-18),
    // subtotal: (Math.random() * (29.95, 129.99)).toFixed(2)
  }

  //load receipt from firebase storage
  loadReceipt() {

    firebase.database().ref(this.firebaseJsonRoutePath + '/receipt/' + this.newReceiptSerial)
      .on('value', (_snapshot: any) => {
        var result = [];
        _snapshot.forEach((_childSnapshot) => {
          var elemnt = _childSnapshot.val();
          elemnt.id = _childSnapshot.key;
          result.push(elemnt);
        });

        //push to collection arry to disp
        this.recieptCollection = result;
      });
  }
  //store image to firebase storage
  makeFileIntoBlob(_imagePath) {
    if (this.platform.is('android')) {
      return new Promise((resolve, reject) => {

        window.resolveLocalFileSystemURL(_imagePath, (fileEntry) => {

          fileEntry.file((resFile) => {

            var reader = new FileReader();
            reader.onloadend = (evt: any) => {
              var imgBlob: any = new Blob([evt.target.result], { type: 'image/jpeg' });
              imgBlob.name = 'sample.jpg';
              resolve(imgBlob);
            };

            reader.onerror = (e) => {
              console.log('Failed file read: ' + e.toString());
              reject(e);
            };

            reader.readAsArrayBuffer(resFile);
          });
        });
      });
    } else {
      // return fetch(_imagePath).then((_response) => {
      //   return _response.blob();
      // }).then((_blob) => {
      //   return _blob;
      // }).catch((_error) => {
      //   alert(JSON.stringify(_error.message));
      // });
    }
  }
  //save to firebase blob/storage
  uploadToFirebase(_imageBlob) {
    var fileName = 'myct-rct-' + new Date().getTime() + '.jpeg';
    return new Promise((resolve, reject) => {
      var fileRef = firebase.storage().ref(this.firebaseJsonRoutePath + '/receipt/' + this.newReceiptSerial + '/' + fileName);
      var uploadTask = fileRef.put(_imageBlob);

      uploadTask.on('state_changed', (_snapshot) => {
        console.log('snapshot progress ' + _snapshot);
      }, (err) => {
        reject(err);
      }, () => {
        //completion..
        resolve(uploadTask.snapshot);
      })
    })
  }
  //save image path to fb database
  saveToDatabaseAssetList(_uploadSnapshot) {

    var ref = firebase.database().ref(this.firebaseJsonRoutePath + '/receipt/' + this.newReceiptSerial);

    return new Promise((resolve, reject) => {
      this.receiptDownloadURL = _uploadSnapshot.downloadURL;
      // we will save meta data of image in database
      var dataToSave = {
        'URL': _uploadSnapshot.downloadURL, // url to access file
        'name': _uploadSnapshot.metadata.name, // name of the file
        'owner': firebase.auth().currentUser.uid,
        'email': firebase.auth().currentUser.email,
        'lastUpdated': new Date().getTime(),
      };

      ref.push(dataToSave, (_response) => {
        resolve(_response);
      }).catch((_error) => {
        reject(_error);
      });
    });

  }

  doGetPicture() {
    // get picture from camera
    Camera.getPicture({
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.CAMERA,
      targetHeight: 640,
      correctOrientation: true
    }).then((_imagePath) => {
      // alert('got image path ' + _imagePath);
      // convert picture to blob
      return this.makeFileIntoBlob(_imagePath);
    }).then((_imageBlob) => {
      // alert('got image blob ' + _imageBlob);
      // upload the blob
      return this.uploadToFirebase(_imageBlob);
    }).then((_uploadSnapshot: any) => {
      // alert('file uploaded successfully  ' + _uploadSnapshot.downloadURL);
      // store reference to storage in database
      return this.saveToDatabaseAssetList(_uploadSnapshot);

    }).then((_uploadSnapshot: any) => {
      // alert('file saved to asset catalog successfully  ');
    }, (_error) => {
      alert('Error ' + _error.message);
    });

  }

  //close modal window
  dismiss() {
    this.viewCtrl.dismiss();
  }

  //save expense to firebase database
  add(expensesModel) {
    this.expenses = this.af.database.list(this.firebaseJsonRoutePath + "/" + this.segment);
    expensesModel.receiptDownloadURL = this.receiptDownloadURL === undefined ? '' : this.receiptDownloadURL;
    expensesModel.lastUpdated = new Date().getTime();
    // expensesModel.tax = expensesModel.taxable !== undefined ? (Number(expensesModel.subtotal) * 0.13).toFixed(2) : 0;
    // expensesModel.expenseSubtotal = expensesModel.taxable !== undefined ? (Number(expensesModel.subtotal) * 0.87).toFixed(2) : expensesModel.subtotal;
    expensesModel.tax = (!isNaN(expensesModel.tax)) ? Number(expensesModel.tax) : 0;
    expensesModel.subtotal = (isNaN(expensesModel.subtotal) === true) ? 0 : Number(expensesModel.subtotal);
    expensesModel.expenseSubtotal = expensesModel.subtotal - expensesModel.tax;
    expensesModel.receiptSerial = this.newReceiptSerial; //use for retrieve photo in update modal;

    this.expenses.push(expensesModel);
    this.dismiss();
  }

  //update expense
  public update(expensesModel) {
    this.expenses = this.af.database.list(this.firebaseJsonRoutePath + "/" + this.segment);
    if(this.receiptDownloadURL !== undefined)
      expensesModel.receiptDownloadURL = this.receiptDownloadURL;
    expensesModel.lastUpdated = new Date().getTime();
    // expensesModel.tax = expensesModel.taxable !== undefined ? (Number(expensesModel.subtotal) * 0.13).toFixed(2) : 0;
    // expensesModel.expenseSubtotal = expensesModel.taxable !== undefined ? (Number(expensesModel.subtotal) * 0.87).toFixed(2) : expensesModel.subtotal;
    expensesModel.tax = (!isNaN(expensesModel.tax)) ? Number(expensesModel.tax) : 0;
    expensesModel.subtotal = (isNaN(expensesModel.subtotal) === true) ? 0 : Number(expensesModel.subtotal);
    expensesModel.expenseSubtotal = expensesModel.subtotal - expensesModel.tax;
    this.expenses.update(this.navParams.data.$key, expensesModel);
    this.dismiss();
  }

  //remove receipe //todo

}
