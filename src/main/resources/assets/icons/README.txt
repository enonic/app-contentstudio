There are now 2 ways of adding icons.

1. Use the api.ui.Icon-class and send your icons css class as a parameter to the constructor along with the size.
This will generate a <i>-element with the icon.

2. Include it in the css, like this:
.form-item-set-drop-allowed {
  background-color: #558e28;
  text-align: center;
  line-height: 48px;
  .icon-checkmark;
  color:white;
}

All icons can be browsed via dem/demo.html page.

To add a new icon, simply find it in the demo page, search it up in icons-all.less and copy-paste the icon code to icons.less.


===

1. Import the svg file into the icomoon app
2. Modify selection
3. Click "Font ->"
4. Set pref - Font Name: live-edit-font-icon, Class Prefix: live-edit-font-icon-, check base64 & embed in CSS
5. Update the font-icon.scss file
6. Update the icomoon svg file for the next person using it
