/*jshint esversion: 6 */

/*
  Manage Information Link View With a current selected link
*/
const LINKVIEW_NEGATIVE_COLOR_TEXT = 'red';
const LINKVIEW_TRANSITIVE_COLOR_TEXT = 'purple';
const LINKVIEW_TRANSITIVE_NEGATIVE_COLOR_TEXT = 'orange';
const LINKVIEW_SUBCLASSOF_COLOR_TEXT = 'blue';

class AskomicsLinkView extends AskomicsObjectView {

  constructor(link) {
    super(link);
    this.link = link ;
  }

  display_help() {
    let help_title = 'Link "'+this.link.label+'"';
    let help_str = 'There is a relation between '+this.link.source.label+' and '+this.link.target.label+'.';
    help_str += ' This mean that attribute '+this.link.target.label+' of '+this.link.source.label+' is an entity.';
    $('#help_figure').addClass( "hidden" );
    __ihm.displayModal(help_title, help_str, 'ok');
  }

  getTextColorLabel() {
    if ( this.link.absentrel && this.link.transitive ) return LINKVIEW_TRANSITIVE_NEGATIVE_COLOR_TEXT;
    if ( this.link.absentrel ) return LINKVIEW_NEGATIVE_COLOR_TEXT;
    if ( this.link.transitive ) return LINKVIEW_TRANSITIVE_COLOR_TEXT;
    if ( this.link.subclassof ) return LINKVIEW_SUBCLASSOF_COLOR_TEXT;
    return this.link.getTextFillColor();
  }

  getTextLabel() {
    if ( this.link.absentrel && this.link.transitive ) return 'NOT '+this.link.label+"+";
    if ( this.link.absentrel ) return 'NOT '+this.link.label;
    if ( this.link.transitive ) return this.link.label+"+";
    if ( this.link.subclassof ) return "subclassof "+this.link.label;
    return this.link.label;
  }

  makeCheckBox(funcCheck,functOk,funcKo) {
    let inp = $('<input>')
    .attr('type', 'checkbox')
    .attr('linkid', this.link.id);

    let mythis = this;

    inp.click(function(d) {
      let linkid = $(this).attr('linkid');
      let link = __ihm.getGraphBuilder().getInstanciedLink(linkid);
      if ($(this).is(':checked')) {
        functOk(link);
      } else {
        funcKo(link);
      }
      $('#'+mythis.link.getSvgLabelId()).find('textPath').attr('fill',mythis.getTextColorLabel());
      $('#'+mythis.link.getSvgLabelId()).find('textPath').text(mythis.getTextLabel());
    });

    if (funcCheck(this.link)) {
      inp.attr('checked', 'checked');
    }
    return inp ;
  }

  create() {
    this.divPanel() ;
    let listProperties = $('<div></div>') ;

    if ( !(this.link instanceof AskomicsIsALink) ) {

      let inpTrans = this.makeCheckBox(
        function (l) {
          return l.transitive;
        } ,
        function (l) {
          l.transitive = true ;
        } ,
        function (l) {
          l.transitive = false ;
        } ) ;

      let inpNeg = this.makeCheckBox(
        function (l) {
          return l.absentrel;
        } ,
        function (l) {
          l.absentrel = true ;
          l.target.sparqlgen = false ;
          l.target.actif = false ;
        } ,
        function (l) {
          l.absentrel = false ;
          l.target.sparqlgen = true ;
          l.target.actif = true ;
        } ) ;

        let inpSub = this.makeCheckBox(
          function (l) {
            return l.subclassof;
          } ,
          function (l) {
            l.subclassof = true ;
          } ,
          function (l) {
            l.subclassof = false ;
          } ) ;

        listProperties.append($("<label></label>").html("Relations properties"))
                                .append($('<br>'))
                                .append($('<label></label>').append(inpTrans).append('Transitive relation'))
                                .append($('<br>'))
                                .append($('<label></label>').append(inpNeg).append('Absent relation'))
                                .append($('<br>'))
                                .append($('<label></label>').append(inpSub).append('Subclassof relation'));
    }

    /* purpose to reverse direcyion if uri are the same between source and target */
    if (this.link.source.uri === this.link.target.uri ) {
      this.details.append(this.getReverseDirection());
    }

    this.details.append($('<hr>'))
                .append(listProperties)
                .append($('<hr>'));

    $("#viewDetails").append(this.details);
  }

}
