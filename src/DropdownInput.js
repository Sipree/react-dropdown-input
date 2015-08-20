//
//  react-dropdown-input
//  Displays a ReactBootstrap.Input element
//  with a ReactBootstrap.DropdownMenu of possible options.
//

'use strict';

var React = require('react/addons');
var ReactBootstrap = require('react-bootstrap');
var joinClasses = require('react/lib/joinClasses');
var cx = require('classnames');

var BootstrapMixin = ReactBootstrap.BootstrapMixin;
var DropdownStateMixin = ReactBootstrap.DropdownStateMixin;
var DropdownMenu = ReactBootstrap.DropdownMenu;
var Input = ReactBootstrap.Input;
var MenuItem = ReactBootstrap.MenuItem;

var defaultMaxText = '+# more not shown';

var defaultFilter = function(filterText, optionName) { // also optionIndex as third arg
  return (optionName.toLowerCase().indexOf(filterText.toLowerCase()) >= 0);
};

var genLength = function(list) {
  // deal with both regular arrays and immutablejs objects, which have .count() instead of length
  return (typeof list.count !== 'undefined' ? list.count() : list.length);
};

var genGet = function(list, i) {
  // deal with both regular arrays and immutablejs objects, which have list.get(i) instead of list[i]
  return (typeof list.get !== 'undefined' ? list.get(i) : list[i]);
};

var caseInsensIndexOf = function(list, str) {
  var lowerList = list.map(function(item) { return item.toLowerCase(); });
  return lowerList.indexOf(str.toLowerCase());
};


var DropdownInput = React.createClass({

  mixins: [BootstrapMixin, DropdownStateMixin],

  propTypes: {
    pullRight: React.PropTypes.bool,
    dropup: React.PropTypes.bool,
    defaultValue: React.PropTypes.string,
	key: React.PropTypes.any,
    menuClassName: React.PropTypes.string,
    max: React.PropTypes.number,
    maxText: React.PropTypes.string,
    onChange: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    onSelect: React.PropTypes.func,
    navItem: React.PropTypes.bool,
    options: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.array]).isRequired,
    filter: React.PropTypes.func,
    // the rest are to make eslint happy
    id: React.PropTypes.string,
    isParentControlled: React.PropTypes.bool,
    customValuesAllowed: React.PropTypes.bool,
    className: React.PropTypes.string,
    bsSize: React.PropTypes.string
  },

  getInitialState: function () {
    return {
      value: this.props.defaultValue || '',
      activeIndex: -1
    };
  },
  uniqueArray: function(arr) {
    var u = {}, a = [];
    for(var i = 0, l = arr.length; i < l; ++i){
      if(!u.hasOwnProperty(arr[i])) {
        a.push(arr[i]);
        u[arr[i]] = 1;
      }
    }
    return a;
  },
  filteredOptions: function() {
    var filter = this.props.filter || defaultFilter;
	return this.uniqueArray(this.props.options.filter(filter.bind(undefined, this.state.value.trim())));
  },

  selectNewOption: function()
  {
    var filteredOptions = this.filteredOptions();
    var numOptions = this.cappedLength(filteredOptions);
    var newName;
    var newIndex = caseInsensIndexOf(this.props.options, this.state.value); // may need this
    if (this.state.activeIndex >= 0 && this.state.activeIndex < numOptions) {
      newIndex = this.state.activeIndex;
      newName = genGet(filteredOptions, this.state.activeIndex);
      this.setDropdownState(false);
    } else if (this.state.activeIndex === -1 && newIndex >= 0) {
      newName = genGet(this.props.options, newIndex);
      this.setDropdownState(false);
    } else if(numOptions > 0 && this.state.value.length > 0) {
      newIndex = 0;//get first index
      newName = filteredOptions[0];
      this.setDropdownState(false);
    }
    else {
      newIndex = this.state.activeIndex;
      newName = this.state.value;
      this.setDropdownState(false);
    }

    if (newName.trim().length > 0) {
	  if(this.props.isParentControlled) {
	    this.props.defaultValue = newName;
	  }
      this.sendSelect({value: newName, index: newIndex, id: this.props.id});
      this.sendChange({value: newName, id: this.props.id });
      this.setState({value: newName, activeIndex: newIndex});
    }
  },

  cappedLength: function(options) {
    var total = genLength(options);
    if (total>this.props.max) {
      // if it exceeded the max, we took an extra one off
      total = this.props.max - 1;
    }
    return total;
  },
  handleOnBlur: function(event) {
    if(!this.props.customValuesAllowed) {
      if(this.state.activeIndex == -1) {
        if(this.props.isParentControlled) {
            this.props.defaultValue = "";
        }
        this.setState({value: ""});
      }//nothing selected
    } 
    if(typeof(this.props.onBlur) !== "undefined") {
      this.props.onBlur(event);
    }
  },
  render: function () {
    var classes = {
        'dropdown': true,
        'open': this.state.open,
        'dropup': this.props.dropup
      };
    // you can provide a filter prop, which is a function(filterText, optionName, optionIndex) which should
    // return true to show option with the given name and index, given the input filterText.
    var filteredOptions = this.filteredOptions();
    var numFiltered = genLength(filteredOptions);
    var maxMenuItem = null;
    var maxText = typeof this.props.maxText === 'undefined' ? defaultMaxText : this.props.maxText;
    if (this.props.max && numFiltered > this.props.max) {
      // take an extra one off, to leave space for the maxText
      filteredOptions = filteredOptions.slice(0, this.props.max - 1);
      maxText = maxText.replace('#', (numFiltered - this.props.max + 1));
      maxMenuItem = this.renderAsMenuItem(maxText, this.props.max, null, true);
    }
    var dropdown = null;
    if (numFiltered>0) {
      dropdown = (<DropdownMenu
          className={this.props.menuClassName}
          ref="menu"
          aria-labelledby={this.props.id}
          pullRight={this.props.pullRight}
          key={1}
          onSelect={null}>
          {filteredOptions.map(this.renderAsMenuItem)}
          {maxMenuItem}
        </DropdownMenu>);
    }

    var isParentControlled = (this.props.hasOwnProperty("isParentControlled") ) ? this.props.isParentControlled: false;
    var value = (isParentControlled) ? this.props.defaultValue : this.state.value;

    return (
      <div className={joinClasses(this.props.className, cx(classes))}>
        <Input
          {...this.props}
          menuClassName={null}
          options={null}
          type="text"
          bsSize={this.props.bsSize}
          ref="dropdownInput"
          onClick={this.handleDropdownClick}
          onBlur={this.handleOnBlur}
          key={this.props.id}
          navDropdown={this.props.navItem}
          navItem={null}
          pullRight={null}
          onSelect={null}
          defaultvalue ={this.props.defaultValue}
          isParentControlled={isParentControlled}
          onChange={this.handleInputChange}
          onKeyDown={this.handleKeyDown}
          dropup={null}
          value={value} />
        {dropdown}
      </div>
    );
  },

  renderAsMenuItem: function(item, index, options, disabled) {
    var start = item.toLowerCase().indexOf(this.state.value.toLowerCase()),
        end = start + this.state.value.length,
        part1 = item.slice(0, start),
        part2 = item.slice(start, end),
        part3 = item.slice(end);
    var classes = cx({active: this.state.activeIndex===index, disabled: disabled===true});
    if (disabled) {
      // don't highlight parts of disabled items, eg. the maxText
      part1 = item;
      part2 = null;
      part3 = null;
    }
    return (
      <MenuItem
        key={index}
        onSelect={this.handleOptionSelect.bind(this, index, item)}
        className={classes}
        onMouseEnter={this.handleMouseEnter.bind(this, index)}>
          {part1}<b>{part2}</b>{part3}
      </MenuItem>
    );
  },

  handleInputChange: function(e) {
    // the user changed the input text
    this.setState({value: e.target.value, activeIndex: -1});
    this.setDropdownState(true);
  	if(this.props.isParentControlled) {
	  this.props.defaultValue =e.target.value;
  	}
    // fire the supplied onChange event.
    //this.sendChange({value: e.target.value, id: this.props.id});
  },

  handleKeyDown: function(e) {
    // catch arrow keys and the Enter key
    var filteredOptions = this.filteredOptions();
    var numOptions = this.cappedLength(filteredOptions);
    var newName;
    switch(e.keyCode){

      case 38: // up arrow
        if (this.state.activeIndex>0) {
          this.setState({activeIndex: this.state.activeIndex-1});
        } else {
          this.setState({activeIndex: numOptions-1});
        }
        break;

      case 40: // down arrow
        this.setState({activeIndex: (this.state.activeIndex+1) % numOptions});
        break;

      case 13: // enter
        this.selectNewOption();
        break;
      case 9: // tab
        this.selectNewOption();
        break;
      //default:
      //  newName = this.state.value;
      //  this.sendChange({value: newName, id: this.props.id});
      //  break;
    }
  },

  handleMouseEnter: function(index) {
    // when the mouse enters a dropdown menu item, set the active item to the item
    this.setState({activeIndex: index});
  },

  handleDropdownClick: function (e) {
    e.preventDefault();

    this.setDropdownState(!this.state.open);
  },

  handleOptionSelect: function(key, name) {
    // the user clicked on a dropdown menu item
	if(this.props.isParentControlled) {
		this.props.defaultValue = name;
	}
    this.setDropdownState(false);
    this.sendSelect({value: name, index: this.state.activeIndex, id: this.props.id});
    this.sendChange({value: name, index: this.state.activeIndex, id: this.props.id});
    this.setState({value: name, activeIndex: -1});
  },

  sendChange: function(val) {
    if (this.props.onChange) {
      this.props.onChange(val);
    }
	if(this.props.isParentControlled) {
    	this.props.defaultValue = val.value;
	}
  },

  sendSelect: function(val) {
    if (this.props.onSelect) {
      this.props.onSelect(val);
    }
	if(this.props.isParentControlled) {
    	this.props.defaultValue = val.value;
	}
  }


});

module.exports = DropdownInput;
