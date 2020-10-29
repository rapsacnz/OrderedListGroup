import { LightningElement, api, track } from 'lwc';

const LEFT = 'left';
const RIGHT = 'right';

export default class OrderedList extends LightningElement {


  /* public attributes */
  @api fieldName = '';
  @api showUpDown = false;
  @api position = LEFT; //can be left or right
  @api
  set values(values) {
    if (!values || values == undefined) {
      this.items = [];
      return;
    }
    console.log(JSON.parse(JSON.stringify(values)));
    this.items = JSON.parse(JSON.stringify(values));
    this.initializeList();
  }
  get values() {
    return this.items;
  }

  draggedItem_ = {}
  @api
  set draggedItem(item) {
    this.draggedItem_ = item;
  }
  get draggedItem() {
    return this.draggedItem_;
  }


  /* private attributes */
  @track items = [];
  @track uuid = '';
  @track highlightedItem = {};
  @track highlightedItems = [];
  changeEventScheduled = false;

  /* public setters */
  //delete item based on unique key
  @api
  deleteItem(itemId) {
    this.items = this.removeItem(itemId, this.items);
  }
  @api
  getMoveItems() {
    return this.highlightedItems;
  }
  @api
  moveItemsHere(items) {
    this.addItems(items);
    this.dispatchMoveComplete();
  }
  @api
  moveItemsAway() {
    this.items = this.removeItems(this.highlightedItems, this.items);
    this.highlightedItems = [];
  }

  @api
  dragItemsAway(itemsDragged) {
    this.items = this.removeItems(itemsDragged, this.items);
  }

  @api
  selectionChanged() {
    this.handleDataChange();
  }

  connectedCallback() {
    this.uuid = this.uniqueId();
  }

  addItems = (newItems) => {
 

    if (!newItems.length) {
      return;
    }

    //remove original selection
    let items = this.removeSelection(this.items);
    newItems.forEach( (item) => {
      this.addItem(items, item);
    });

    items = this.renumberItems(items);
    items = this.sortItems(items);

    this.items = items;
  }

  handleListClick = (event) => {
    let id = event.currentTarget.dataset.id;
    let items = this.items;
    let itemOriginal = this.itemOriginal;

    var item = this.getItem(id, items);
    items = this.removeSelection(items);

    if (event.shiftKey && itemOriginal) {
      //make a selection from one to the next!
      var start = item.sort < itemOriginal.sort ? item.sort : itemOriginal.sort;
      var end = item.sort > itemOriginal.sort ? item.sort : itemOriginal.sort;

      var subset = this.getItems(start, end, items);

      subset = this.addSelection(subset);
      this.highlightedItems = subset;
      this.highlightedItem = '';
    }
    else {
      this.addSelection([item]);
      this.highlightedItems = [item];
      this.highlightedItem = item;
    }
    this.listName = items;

  }


  dispatchMoveItems = () => {
    const moveitems = new CustomEvent('moveitems', {
      detail: { uuid: this.uuid, items: this.highlightedItems }
    });
    this.dispatchEvent(moveitems);
  }

  dispatchMoveComplete = () => {
    const moveitems = new CustomEvent('movecomplete', {
      detail: { uuid: this.uuid }
    });
    this.dispatchEvent(moveitems);
  }

  dispatchDragComplete = (items) => {
    const moveitems = new CustomEvent('dragcomplete', {
      detail: { uuid: this.uuid, items: items }
    });
    this.dispatchEvent(moveitems);
  }



  handleReorderItemUp = (event) => {
    this.reorderItem('up');
  }
  handleReorderItemDown = (event) => {
    this.reorderItem('down');
  }

  handleOnDoubleClick = (event) => {
    event.preventDefault();

    let id = event.currentTarget.dataset.id;
    var item = this.getItem(id, this.items);

    this.removeSelection(this.items);
    this.addSelection([item]);
    this.highlightedItems = [item];
    this.highlightedItem = item;

    this.dispatchMoveItems();

  }


  /***************************************
   *  DRAG AND DROP
   ***************************************/

  handleOnDragStart = (event) => {

    let id = event.currentTarget.dataset.id;
    let items = this.items;
    var item = this.getItem(id, items);
    item.parentId = this.uuid;
    event.dataTransfer.setData("text", JSON.stringify(item));
  }

  handleOnDragEnter = (event) => {
    event.preventDefault();
  }

  handleOnDragLeave = (event) => {
    event.preventDefault();
  }


  handleOnDropParent = (event) => {

    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer == null){
      return;
    }

    let targetElementId = event.target.dataset.id;
    let parentHandlingEvent = (targetElementId == this.uuid);
    console.log(`target element id ${targetElementId}`);

    let targetList = event.currentTarget;

    //if NOT (dropped onto the parent list and no items) 
    let targetListItem = {};
    if ( !parentHandlingEvent ) {
      targetListItem = this.template.querySelector(`.${targetElementId}`);
      console.log(`target list item id ${targetListItem.dataset.id}`);
    }
    let rawData = event.dataTransfer.getData('text');
    let item = JSON.parse(rawData);
    let droppedOnSelf = (item.parentId == this.uuid);
    console.log(`raw data ${rawData}`);

    let items = this.items;
    console.log(`existing in-memory items ${JSON.stringify(items)}`);

    let receivingItem = this.getItem(targetElementId, items);
    item = this.getItem(item.id, items) || item;
    console.log(`existing in-memory item ${JSON.stringify(items)}`);


    //no items in the list or item wasn't dropped on a list item
    //possibly bad if there isn't a recieving item found but we are rearranging items
    //could lead to duplication
    if (!items || items.length === 0 || !receivingItem) {
      item = this.addItem(items, item);
    }
    //item comes from other list
    else if (item.parentId !== this.uuid) {
      receivingItem.parentId = this.uuid;
      items = this.insertItemAt(item, receivingItem, items);
    }
    //item from this list (just reorder)
    else {
      receivingItem.parentId = this.uuid;
      items = this.swapItem(item, receivingItem, items);
      items = this.sortItems(items);
    }

    items = this.renumberItems(items);
    items = this.sortItems(items);

    this.items = items;

    if (!(item instanceof Array)) {
      item = [item];
    }

    //no drag complete if this list was the originator (droppedOnSelf)
    if (!droppedOnSelf){
      this.dispatchDragComplete(item);
    }
  }

  /*dummy methods*/
  handleOnDragOver = (event) => {
    event.dataTransfer.dropEffect = 'move';
    event.preventDefault();
  }
  handleOnDragOverDummy = (event) => {
    event.dataTransfer.dropEffect = 'move';
    event.preventDefault();
  }
  handleOnDragEnterDummy = (event) => {
    event.preventDefault();
  }
  handleOnDragLeaveDummy = (event) => {
    event.preventDefault();
  }
  handleOnDrop = (event) => {
    event.preventDefault();
  }

/*styles*/
get listBoxClass() {
  return ` slds-listbox__item `;
}

/***************************************
 *  LIST FUNCTIONS 
 ***************************************/

initializeList =()=> {
  this.items.forEach((item, index)=> {
    item.sort = index;
    item.style = '';
    item.selected = false;
    item.id = this.uniqueId();
    item.class = ` slds-listbox__item ${item.id}`;
  });

}

getItem = (id, items)=> {
  var itemToReturn;
  items.forEach((item)=> {
    if (item.id === id) {
      itemToReturn = item;
    }
  });
  return itemToReturn;
}

getItemBySort = (sort, items) => {
  var itemToReturn;
  items.forEach( (item)=>{
    if (item.sort === sort) {
      itemToReturn = item;
    }
  });
  return itemToReturn;
}

getItems = (start, end, items)=> {
  var itemsToReturn = [];
  items.forEach((item) => {
    if (item.sort >= start && item.sort <= end) {
      itemsToReturn.push(item);
    }
  });
  return itemsToReturn;
}

addItem = (items, item)=> {
  item.style = '';
  //swap sorts
  var savedSort = item.savedSort;
  item.savedSort = item.sort;
  item.sort = savedSort;

  console.log('added: ' + JSON.stringify(item));

  items.push(item);
  return item;
}

removeItems = (itemsToRemove, items)=> {

  itemsToRemove.forEach( (itemToRemove)=> {
    items = items.filter( (item)=> {
      return item.id !== itemToRemove.id;
    });
  });
  return items;
}

removeItem = (id, items) => {
  items.forEach((item, index) => {
    if (item.id === id) {
      items.splice(index, 1);
    }
  });
  return items;
}

sortItems = (items) => {
  items.sort((a, b) => {
    return a.sort > b.sort ? 1 : -1;
  });
  return items;
}

renumberItems = (items) => {

  items = this.sortItems(items);
  items.forEach((item, index) => {
    item.sort = index;
  });
  return items;
}

removeSelection = (items) => {
  items.forEach((item) => {
    item.selected = false;
  });
  return items;
}

addSelection = (items) => {
  items.forEach((item) => {
    item.selected = true;
  });
  return items;
}

removeStyles = (items) => {
  items.forEach((item) => {
    item.style = '';
  });
  return items;
}

addStyles = (items, style) => {
  items.forEach((item) => {
    item.style = style;
  });
  return items;
}

swapItem = (fromItem, toItem, items) => {

  //save desired sort
  var toIndex = toItem.sort;

  items.forEach((item) => {
    if (item.id == fromItem.id) {
      item.sort = toIndex;
    }
    else if (item.sort >= toIndex) {
      item.sort++;
    }
  });

  return items;
}


insertItemAt = (fromItem, toItem, items) => {

  var toSort = toItem.sort;
  var toIndex = -1;

  items.forEach((item, index) => {
    if (item.sort === toSort) {
      toIndex = index;
    }
    if (item.sort >= toSort) {
      item.sort++;
    }
  });
  if (toIndex > -1) {
    fromItem = JSON.parse(JSON.stringify(fromItem));
    fromItem.sort = toSort;
    items.splice(toIndex, 0, fromItem);
  }
  return items

}

reorderItem = (direction) => {

  let items = this.items;
  let swapItem, swapIndex;
  let item = this.highlightedItem;

  if (!item) {
    return;
  }

  //clear selected list
  this.highlightedItems = [item];


  items = this.renumberItems(items);

  if (direction == 'up') {
    if (item.sort < 1) {
      return;
    }
    swapIndex = item.sort - 1;
  }
  if (direction == 'down') {
    if (item.sort == items.length) {
      return;
    }
    swapIndex = item.sort + 1;
  }
  swapItem = this.getItemBySort(swapIndex, items);
  if (!swapItem) {
    return;
  }
  var temp = item.sort;
  item.sort = swapItem.sort;
  swapItem.sort = temp;
  console.log('swapitem sort: ' + swapItem.sort + ' item sort: ' + item.sort);

  //sort and save
  items = this.sortItems(items);

  this.highlightedItem = item;

}

uniqueId() {
  var chars = 'abcdefghijklmnopqrstuvwxyz'.split('');

  var uuid = [], rnd = Math.random, r;
  uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
  uuid[14] = 'z'; // version z

  for (var i = 0; i < 36; i++) {
    if (!uuid[i]) {
      r = 0 | rnd() * 26;

      uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
    }
  }

  return uuid.join('');
}

}