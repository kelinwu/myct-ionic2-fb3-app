import { Component, OnInit } from '@angular/core';
import { NavController, ViewController, NavParams, ModalController,Platform } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { Camera } from 'ionic-native';

declare var window: any;

@Component({
    templateUrl: 'build/pages/modal/corp/corpModal.html',
})
export class CorpModalPage {
    formInit: any;
    logoCollection: any;
    authUserId: string;
    corpInfo:FirebaseListObservable<any[]>;
    firebaseJsonRoutePath: string;
    logoDownloadURL: string;

    constructor(
        private navCtrl: NavController,
        private viewCtrl: ViewController,
        private navParams: NavParams,
        private platform: Platform,
        private af: AngularFire
    ) { }

    ngOnInit() {
        this.authUserId = firebase.auth().currentUser.uid;
        this.corpInfo = this.af.database.list(this.authUserId + '/corp');
        this.formInit = this.navParams.data;
        this.firebaseJsonRoutePath = this.authUserId+'/logo';

        //load logo
        this.loadReceipt();
    }


    update(updatedCorpModal) {
        var newModel = { 
            corp: {
                companyName: updatedCorpModal.c_companyName,
                address: updatedCorpModal.c_address,
                email: updatedCorpModal.c_email,
                phone: updatedCorpModal.c_phone,
                fax: updatedCorpModal.c_fax,
                // gst: updatedCorpModal.c_gst,
                // pst: updatedCorpModal.c_pst,
                // hst: updatedCorpModal.c_hst
            },
            mainContact: {
                email: updatedCorpModal.m_email,
                firstName: updatedCorpModal.m_firstName,
                lastName: updatedCorpModal.m_lastName,
                phone: updatedCorpModal.m_phone
            }
        }
        this.corpInfo.update(this.navParams.data.$key, newModel);
        // var ref = firebase.database().ref(this.authUserId + '/corp');
        // ref.set({
        //     corp: {
        //         companyName: corpModal.corp_companyName,
        //         address: corpModal.corp_address,
        //         email: corpModal.corp_email,
        //         phone: corpModal.corp_phone,
        //         fax: corpModal.corp_fax,
        //         tax: corpModal.corp_tax
        //     },
        //     mainContact: {
        //         email: corpModal.mainContact_email,
        //         firstName: corpModal.mainContact_firstName,
        //         lastName: corpModal.mainContact_lastName,
        //         phone: corpModal.mainContact_phone
        //     }
        // });
        this.dismiss();
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    //load logo objectArray from firebase storage
  loadReceipt() {

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
    var fileName = 'myct-logo.jpeg';
    return new Promise((resolve, reject) => {
      var fileRef = firebase.storage().ref(this.firebaseJsonRoutePath + '/' + fileName);
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

    var ref = firebase.database().ref(this.firebaseJsonRoutePath);

    return new Promise((resolve, reject) => {
      this.logoDownloadURL = _uploadSnapshot.downloadURL;
      // we will save meta data of image in database
      var dataToSave = {
        'URL': _uploadSnapshot.downloadURL, // url to access file
        'name': _uploadSnapshot.metadata.name, // name of the file
        'owner': firebase.auth().currentUser.uid,
        'email': firebase.auth().currentUser.email,
        'lastUpdated': new Date().getTime(),
      };

      ref.set(dataToSave, (_response) => {
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
}

