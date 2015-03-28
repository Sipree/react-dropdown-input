//
//  DropdownInput, using React-Bootstrap
//  Displays a ReactBootstrap.Input element 
//  with a ReactBootstrap.DropdownMenu of possible options.
//
//  The options are simply passed as a javascript array (or immutablejs object)
//  to the 'options' prop.
//
//  Supply one or both of these callbacks: onSelect & onChange.
//  onSelect fires when an option is clicked, or when Enter is pressed.
//    It passes the object:
//    { value: input text,
//      index: option index, or -1 if the user has entered their own text and pressed Enter
//    }
//  onChange fires whenever the input text value changes, either due to a click or typing.
//    It passes the object:
//    { value: input text }
//
//  Other props you can pass:
//  filter: a function that determines which options to show, given the input text
//          (see defaultFilter below for the default)
//  menuClassName: a class for the menu, which you need for the css styling below;
//          eg. 'dropdown-input'.
//
//  Eg.
//   var searchNames = ['Sydney', 'Melbourne', 'Brisbane', 'Adelaide', 'Perth', 'Hobart'];
//   <DropdownInput 
//     menuClassName='dropdown-input'
//     onSelect={this.handleSelectName}
//     onChange={this.handleChangeName}
//     defaultValue={this.props.initialValue}
//     placeholder='Search...'
//     options={searchNames}
//   >
//   </DropdownInput>
//
// You can also pass <DropdownInput> all the properties that <ReactBootstrap.Input> allows,
// eg. ButtonAfter.
//
// IMPORTANT NOTE
// You need to turn off Bootstrap's hover highlighting css for this element;
// we do it manually using the active class instead.  You may also need to re-enable
// the hover highlighting on the active class.  Eg. in sass, add:
//
// .dropdown-input .dropdown-menu > li > a {
//   &:hover,
//   &:focus {
//     color: $dropdown-link-color;
//     background-color: $dropdown-bg;
//   }
// }
// .dropdown-input .dropdown-menu > .active > a {
//   &:hover,
//   &:focus {
//     text-decoration: none;
//     color: $dropdown-link-hover-color;
//     background-color: $dropdown-link-hover-bg;
//   }
// }



var React = require('react/addons');
var ReactBootstrap = require('react-bootstrap');
var joinClasses = require('react/lib/joinClasses');
var cx = require('classnames');

var BootstrapMixin = ReactBootstrap.BootstrapMixin;
var DropdownStateMixin = ReactBootstrap.DropdownStateMixin;

var Input = ReactBootstrap.Input;
var DropdownMenu = ReactBootstrap.DropdownMenu;
var MenuItem = ReactBootstrap.MenuItem;


var defaultFilter = function(filterText, optionName, optionIndex) {
  return (optionName.toLowerCase().indexOf(filterText.toLowerCase())>=0);
}

var genLength = function(list) {
  // deal with both regular arrays and immutablejs objects, which have .count() instead of length
  return (typeof list.count!=='undefined' ? list.count() : list.length);
}

var genGet = function(list, i) {
  // deal with both regular arrays and immutablejs objects, which have list.get(i) instead of list[i]
  return (typeof list.get!=='undefined' ? list.get(i) : list[i]);
}

var caseInsensIndexOf = function(list, str) {
  var lowerList = list.map(function(item) { return item.toLowerCase() });
  return lowerList.indexOf(str.toLowerCase());
}


var DropdownButton = React.createClass({
  mixins: [BootstrapMixin, DropdownStateMixin],

  propTypes: {
    pullRight: React.PropTypes.bool,
    dropup:    React.PropTypes.bool,
    defaultValue: React.PropTypes.string,
    menuClassName: React.PropTypes.string,
    onChange:  React.PropTypes.func,
    onSelect:  React.PropTypes.func,
    navItem:   React.PropTypes.bool,
    options:   React.PropTypes.object,
    filter:    React.PropTypes.func
  },

  getInitialState: function () {
    return {
      value: this.props.defaultValue || '',
      activeIndex: -1
    };
  },

  filteredOptions: function() {
    var filter = this.props.filter || defaultFilter;
    return this.props.options.filter(filter.bind(undefined, this.state.value));
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
    var dropdown = null;
    if (genLength(filteredOptions)>0) {
      dropdown = (<DropdownMenu
          className={this.props.menuClassName}
          ref="menu"
          aria-labelledby={this.props.id}
          pullRight={this.props.pullRight}
          key={1}
          onSelect={null}>
          {filteredOptions.map(this.renderAsMenuItem)}
        </DropdownMenu>);
    }
    return (
      <div className={joinClasses(this.props.className, cx(classes))}>
        <Input
          {...this.props}
          type="text" 
          bsSize={this.props.bsSize} 
          ref="dropdownInput"
          onClick={this.handleDropdownClick}
          key={0}
          navDropdown={this.props.navItem}
          navItem={null}
          pullRight={null}
          onSelect={null}
          onChange={this.handleInputChange}
          onKeyDown={this.handleKeyDown}
          dropup={null}
          value={this.state.value} />
        {dropdown}
      </div>
    );
  },

  renderAsMenuItem: function(item, index) {
    var start = item.toLowerCase().indexOf(this.state.value.toLowerCase()),
        end   = start + this.state.value.length,
        part1 = item.slice(0,start),
        part2 = item.slice(start, end),
        part3 = item.slice(end);
    var classes = cx({active: this.state.activeIndex===index});
    
    return (
      <MenuItem 
        key={index} 
        onSelect={this.handleOptionSelect.bind(this, index, item)} 
        className={classes}
        onMouseEnter={this.handleMouseEnter.bind(this, index)}>
          {part1}<b>{part2}</b>{part3}
      </MenuItem>
    )
  },

  handleInputChange: function(e) {
    // the user changed the input text
    this.setState({value: e.target.value, activeIndex: -1});
    this.setDropdownState(true);
    // fire the supplied onChange event.
    this.sendChange({value: e.target.value});
  },

  handleKeyDown: function(e) {
    // catch arrow keys and the Enter key
    var filteredOptions = this.filteredOptions();
    var numOptions = genLength(filteredOptions);
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
        if (this.state.activeIndex >= 0 && this.state.activeIndex < numOptions) {
          newName = genGet(filteredOptions, this.state.activeIndex);
          this.setDropdownState(false);
        } else if (this.state.activeIndex === -1 && caseInsensIndexOf(this.props.options, this.state.value)>=0) {
          newName = genGet(this.props.options, caseInsensIndexOf(this.props.options, this.state.value));
          this.setDropdownState(false);
        } else {
          newName = this.state.value;
        }
        this.sendSelect({value: newName, index: this.state.activeIndex});
        this.sendChange({value: newName});
        this.setState({value: newName, activeIndex: -1});
        break;

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

  handleOptionSelect: function(key, name, e) {
    // the user clicked on a dropdown menu item
    this.setDropdownState(false);
    this.sendSelect({value: name, index: this.state.activeIndex});
    this.sendChange({value: name});
    this.setState({value: name, activeIndex: -1});
  },

  sendChange: function(e) {
    if (this.props.onChange) {
      this.props.onChange(e);
    }
  },

  sendSelect: function(e) {
    if (this.props.onSelect) {
      this.props.onSelect(e);
    }
  }


});

module.exports = DropdownButton;
