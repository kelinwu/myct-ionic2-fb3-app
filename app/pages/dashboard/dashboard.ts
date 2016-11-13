import { Component, OnInit } from '@angular/core';
import { NavController,ActionSheetController,Platform } from 'ionic-angular';
declare var d3: any;

@Component({
  templateUrl: 'build/pages/dashboard/dashboard.html',
})
export class DashboardPage {
  incomeSummary: any;
  expenseSummary: any;
  reportData: any;
  authUserId: string;
  thisFiscal: number;
  expenseItems: Array<{ expenseName: string, expenseSubtt: number }>;
  incomeItems: Array<{ clientName: string, incomeSubtt: number }>
  // groupedExp: Array<any>;
  constructor(private navCtrl: NavController,
  private platform: Platform,
  private actionsheetCtrl:ActionSheetController) { }

  ngOnInit() {

    this.authUserId = firebase.auth().currentUser.uid;
    this.thisFiscal = new Date().getFullYear();
    this.reportData = {
      profitloss: {},
      taxSummary: {}
    }

    var ref = firebase.database().ref(this.authUserId + '/' + this.thisFiscal);
    var incomeTotal = 0, incomeTax = 0;
    
    var expenseName;
    this.incomeItems = [];
    //income calc
    ref.child('income').on('value', (_snapshot: any) => {
      _snapshot.forEach((_childSnapshot) => {
        incomeTotal += Number(_childSnapshot.val().subtotal);
        incomeTax += Number(_childSnapshot.val().tax);

        //income sum
        this.incomeItems.push({
          clientName: _childSnapshot.val().selectedClient,
          incomeSubtt: _childSnapshot.val().subtotal
        })

        //grouped sum income list
        var _groupInArray = [];
        var _groupedInObj = [];
        var items = this.incomeItems;

        for (var i = 0; i < items.length; i++) {
          if (!_groupInArray.hasOwnProperty(items[i].clientName)) {
            _groupInArray[items[i].clientName] = 0;
          }
          _groupInArray[items[i].clientName] = Number(_groupInArray[items[i].clientName]) + Number(items[i].incomeSubtt);
        }

        Object.keys(_groupInArray).map(function (key) {
          _groupedInObj.push({ 'clientName': key, 'incomeSubtt': _groupInArray[key].toFixed(2) });
        });

        //expense calc
        this.expenseItems = [];
        var expenseTotal = 0, expenseTax = 0;
        ref.child('expense').on('value', (_snapshot: any) => {

          _snapshot.forEach((_childSnapshot) => {
            expenseTotal += Number(_childSnapshot.val().expenseSubtotal);
            expenseTax += Number(_childSnapshot.val().tax);

            //detail expense list
            this.expenseItems.push({
              expenseName: _childSnapshot.val().selectedCategory,
              expenseSubtt: _childSnapshot.val().expenseSubtotal
            })

            // grouped sum expense list
            var _groupExpArray = [];
            var _groupedExpObj = [];
            var items = this.expenseItems;

            for (var i = 0; i < items.length; i++) {
              if (!_groupExpArray.hasOwnProperty(items[i].expenseName)) {
                _groupExpArray[items[i].expenseName] = 0;
              }
              _groupExpArray[items[i].expenseName] = Number(_groupExpArray[items[i].expenseName]) + Number(items[i].expenseSubtt);
            }

            Object.keys(_groupExpArray).map(function (key) {
              _groupedExpObj.push({ 'expenseName': key, 'expenseSubtt': _groupExpArray[key].toFixed(2) });
            });

            this.reportData = {
              profitloss: {
                income: incomeTotal.toFixed(2),
                expense: Number(expenseTotal).toFixed(2),
                result: (incomeTotal - expenseTotal).toFixed(2),
                color: (incomeTotal - expenseTotal) > 0 ? 'green' : 'red'
              },
              taxSummary: {
                salesTax: incomeTax.toFixed(2),
                expenseTax: Number(expenseTax).toFixed(2),
                result: (incomeTax - expenseTax).toFixed(2),
                color: (incomeTotal - expenseTotal) > 0 ? 'green' : 'red'
              },
              expensesSummary: _groupedExpObj,
              incomeSummary: _groupedInObj
            }
            
            var pieProflossData = [], pieTaxsumData = [];
            pieProflossData.push({"label": "GP: "+incomeTotal.toFixed(2), "value": incomeTotal.toFixed(2)});
            pieProflossData.push({"label": "TE: "+expenseTotal.toFixed(2), "value": expenseTotal.toFixed(2)});
            
            pieTaxsumData.push({"label": "ST: " + incomeTax.toFixed(2), "value": incomeTax.toFixed(2)});
            pieTaxsumData.push({"label": "ET: " + Number(expenseTax).toFixed(2), "value": Number(expenseTax).toFixed(2)});

            this.createPie("pieProfLos",pieProflossData);
            this.createPie("pieTaxSum",pieTaxsumData);

            this.createChart();

          });

        });
      });
    })



  }

createPie(pieElment, data: any){
  var w = 300,                        //width
            h = 300,                            //height
            r = 75;                            //radius
        var color = d3.scale.category20c();     //builtin range of colors

        var vis = d3.select("." + pieElment).append("svg")
            .data([data])
            .attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
            .attr("height", h)
            .append("svg:g")                //make a group to hold our pie chart
            .attr("transform", "translate(" + r + "," + r + ")")    //move the center of the pie chart from 0, 0 to radius, radius

        var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
            .outerRadius(r);

        var pie = d3.layout.pie()           //this will create arc data for us given a list of values
            .value(function (d) { return d.value; });    //we must tell it out to access the value of each element in our data array

        var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
            .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
            .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
            .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
            .attr("class", "slice");    //allow us to style things in the slices (like text)

        arcs.append("svg:path")
            .attr("fill", function (d, i) {
                //return 'blue';
                return color(i);
            }) //set the color for each slice to be chosen from the color function defined above
            .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function

        arcs.append("svg:text")                                     //add a label to each slice
            .attr("transform", function (d) {                    //set the label's origin to the center of the arc
                //we have to make sure to set these before calling arc.centroid
                d.innerRadius = 0;
                d.outerRadius = r;
                return "translate(" + arc.centroid(d) + ")";        //this gives us a pair of coordinates like [50, 50]
            })
            .attr("text-anchor", "middle")                          //center the text on it's origin
            .text(function (d, i) { return data[i].label; });        //get the label from our original data array


}

  createChart() {
    var data = [4, 8, 15, 16, 23, 42];

    var width = 420,
      barHeight = 20;

    var x = d3.scale.linear()
      .domain([0, d3.max(data)])
      .range([0, width]);
      // .attr('transform', "rotate(-90,0,0)");

    var chart = d3.select(".chart")
      .attr("width", width)
      .attr("height", barHeight * data.length);

    var bar = chart.selectAll("g")
      .data(data)
      .enter().append("g")
      .attr("transform", function (d, i) { return "translate(0," + i * barHeight + ")"; });

    bar.append("rect")
      .attr("width", x)
      .attr("height", barHeight - 1);

    bar.append("text")
      .attr("x", function (d) { return x(d) - 3; })
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .text(function (d) { return d; });

  }

  openMenu() {
    let actionSheet = this.actionsheetCtrl.create({
      title: 'Select Report Period',
      cssClass: 'action-sheets-basic-page',
      buttons: [
        {
          text: 'last  3 month',
          role: 'destructive',
          icon: !this.platform.is('ios') ? 'arrow-dropright-circle' : null,
          handler: () => {
            console.log('last 3 month');
          }
        },
        {
          text: 'last 6 month',
          icon: !this.platform.is('ios') ? 'arrow-dropright-circle' : null,
          handler: () => {
            console.log('last 6 month');
          }
        },
        {
          text: 'last 9 month',
          icon: !this.platform.is('ios') ? 'arrow-dropright-circle' : null,
          handler: () => {
            console.log('last 9 month');
          }
        },
                {
          text: 'Share',
          icon: !this.platform.is('ios') ? 'share' : null,
          handler: () => {
            console.log('Share');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel', // will always sort to be on the bottom
          icon: !this.platform.is('ios') ? 'close' : null,
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present()
  }

}
