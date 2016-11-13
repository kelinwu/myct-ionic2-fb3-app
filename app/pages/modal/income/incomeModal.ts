import { Component, OnInit } from '@angular/core';
import { NavController, Platform, ViewController, NavParams, ModalController } from 'ionic-angular';
import { FirebaseListObservable, AngularFire } from 'angularfire2';
import { Camera } from 'ionic-native';
declare var window: any;

@Component({
    templateUrl: 'build/pages/modal/income/incomeModal.html',
})

export class IncomeModalPage {
    invoiceCollection: any;
    segment;
    thisFiscal: number;
    customers: FirebaseListObservable<any[]>;
    formInit;
    authUserId: string;
    incomes: FirebaseListObservable<any[]>;
    invoiceSerial: string;
    newInvoiceSerial: string;
    invoiceDownloadURL: string;
    rdnSubTT: any;
    firebaseJsonRoutePath: string;
    firebaseJsonRouteClient: string;
    isNew: boolean;
    isUpdate: boolean;

    constructor(
        public platform: Platform,
        public navParams: NavParams,
        public viewCtrl: ViewController,
        private af: AngularFire,
        private modalCtrl: ModalController
    ) {
    }

    ngOnInit() {

        this.segment = "income";
        this.thisFiscal = new Date().getFullYear();
        this.authUserId = firebase.auth().currentUser.uid;
        this.invoiceSerial = this.navParams.data.invoiceSerial;
        this.newInvoiceSerial = this.invoiceSerial === undefined
            ? this.authUserId + Date.now() + Math.random().toString(36).slice(-8)
            : this.invoiceSerial;
        this.firebaseJsonRoutePath = this.authUserId + '/' + this.thisFiscal;
        this.firebaseJsonRouteClient = this.authUserId;

        this.customers = this.af.database.list(this.firebaseJsonRouteClient + '/customer');
        // this.rdnSubTT = (Math.random() * (5000, 10000)).toFixed(2);

        if (this.navParams.data.subtotal !== undefined) {
            this.isUpdate = true;
            this.isNew = false;
        } else {
            this.isUpdate = false;
            this.isNew = true;
        }

        this.formInit = (this.navParams.data.subtotal === undefined) ? {} : this.navParams.data;
        this.loadInvoice();

        // this.formInit = {
        //     selectedClient: '1234',
        //     item: Math.random().toString(36).slice(-18),
        //     subtotal: this.rdnSubTT,
        //     tax: (this.rdnSubTT * 13 / 100).toFixed(2)
        // }
    }

    //load invoice from firebase storage
    loadInvoice() {
        firebase.database().ref(this.firebaseJsonRoutePath + '/invoice/' + this.newInvoiceSerial)
            .on('value', (_snapshot: any) => {
                var result = [];
                _snapshot.forEach((_childSnapshot) => {
                    var elemnt = _childSnapshot.val();
                    elemnt.id = _childSnapshot.key;
                    result.push(elemnt);
                });

                //set the componet key
                this.invoiceCollection = result;
                // console.log(result);
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
        var fileName = 'myct-inv-' + new Date().getTime() + '.jpeg';
        return new Promise((resolve, reject) => {
            var fileRef = firebase.storage().ref(this.firebaseJsonRoutePath + '/invoice/' + this.newInvoiceSerial + '/' + fileName);
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

        var ref = firebase.database().ref(this.firebaseJsonRoutePath + '/invoice/' + this.newInvoiceSerial);

        return new Promise((resolve, reject) => {
            this.invoiceDownloadURL = _uploadSnapshot.downloadURL;
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

    //save income to fb database
    add(incomesModel) {
        this.incomes = this.af.database.list(this.firebaseJsonRoutePath + "/" + this.segment);
        incomesModel.invoiceDownloadURL = this.invoiceDownloadURL === undefined ? '' : this.invoiceDownloadURL;
        incomesModel.lastUpdated = new Date().getTime();
        incomesModel.invoiceSerial = this.newInvoiceSerial;
        incomesModel.subtotal = (!isNaN(incomesModel.subtotal)) ? Number(incomesModel.subtotal) : 0;
        incomesModel.tax = (!isNaN(incomesModel.tax)) ? Number(incomesModel.tax) : 0;
        this.incomes.push(incomesModel);
        this.dismiss();
    }

    //update income
    update(incomesModel) {
        this.incomes = this.af.database.list(this.firebaseJsonRoutePath + "/" + this.segment);
        if (this.invoiceDownloadURL !== undefined) // new photo taken
            incomesModel.invoiceDownloadURL = this.invoiceDownloadURL;
        incomesModel.lastUpdated = new Date().getTime();
        incomesModel.subtotal = (!isNaN(incomesModel.subtotal)) ? Number(incomesModel.subtotal) : 0;
        incomesModel.tax = (!isNaN(incomesModel.tax)) ? Number(incomesModel.tax) : 0;
        this.incomes.update(this.navParams.data.$key, incomesModel);
        this.dismiss();
    }

    //remove Invoice

    // openModal(option) {
    //     let modal = this.modalCtrl.create(CustomerModalPage, option);
    //     modal.present();
    // }

}
