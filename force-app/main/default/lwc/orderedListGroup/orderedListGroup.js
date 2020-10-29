import { LightningElement, track, api } from 'lwc';

export default class OrderedListGroup extends LightningElement {
  
  @api fieldName = 'Lead Stages';

  @api
  set leftValues(values){
    this.leftValues_ = JSON.parse(JSON.stringify(values));
  }
  get leftValues(){
    return this.leftValues_;
  }
  @track leftValues_= [];

  @api
  set rightValues(values){
    this.rightValues_ = JSON.parse(JSON.stringify(values));
  }
  get rightValues(){
    return this.rightValues_;
  }
  @track rightValues_= [];

  get selectedName(){
    return `Selected ${this.fieldName} Values`;
  }


  moveLeftToRight = (event) => {
    
    const right = this.template.querySelector(".right");
    const left =  this.template.querySelector(".left");

    let items = left.getMoveItems();
    right.moveItemsHere(items);
    left.moveItemsAway();
  
  }

  moveRightToLeft = (event) => {
    
    const right = this.template.querySelector(".right");
    const left =  this.template.querySelector(".left");

    let items = right.getMoveItems();
    left.moveItemsHere(items);
    right.moveItemsAway();
  
  }


  handleDragCompleteLeft = (event) => {
    const right = this.template.querySelector(".right");
    right.dragItemsAway(event.detail.items);
  }

  handleDragCompleteRight = (event) => {
    const left = this.template.querySelector(".left");
    left.dragItemsAway(event.detail.items);
  }
}