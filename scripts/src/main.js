/**
 * @jsx React.DOM
 */
var React = require('react');

var HelloMessage = React.createClass({
  render: function() {
    return <h1>Hello {this.props.name}</h1>;
  }
});

React.render(<HelloMessage name="Superhallo! Jurre" />, document.getElementById('react-root'));
