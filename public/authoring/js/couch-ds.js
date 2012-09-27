/*globals msaPreview $ console*/

msaPreview = {};

msaPreview.CouchDS = function(authoredDocId) {
  $.couch.urlPrefix = "/mysystem_designs";
  this.db = $.couch.db('');
};

msaPreview.CouchDS.prototype =
{
  db: null,
  authoredDocId: null,
  authoredDocRev: null,
  learnerDocId: null,
  learnerDocRev: null,
  authorContentWindow: null,
  learnerContentWindow: null,
  
  
  setAuthorContentWindow: function (contentWindow) {
    this.authorContentWindow = contentWindow;
  },
  
  
  setLearnerContentWindow: function (contentWindow) {
    this.learnerContentWindow = contentWindow;
  },

  loadData: function (data_id, callback) {
    var self = this;
    this.db.openDoc(
      data_id, 
      {
        success: function (response) {
          callback(response);
        },
        error: function (response) {
          alert("Could not find a document with the id '"+self.authoredDocId+"'");
          window.location.hash = '';
        }
      }
    );
  },

  saveData: function(data, docId, revId, callback) {
    if (!!docId){
      console.log("saving with known id "+this.learnerDocId);
      data._id = docId;
    }
    if (!!revId){
      data._rev = revId;
    }
    
    var self = this;
    this.db.saveDoc(  
      data,  
      { 
        success: function(response) { 
          console.log("Saved ok, id = "+response.id);
          window.location.hash = (self.authoredDocId || "") + (self.learnerDocId ? "/"+self.learnerDocId : "");
          var url = window.location.href;
          var gritId = $.gritter.add({
            title: 'Data saved.',
            text: url,
            sticky: true
          });
          var domElement = $('#gritter-item-'+gritId);
          self.makeCopyLink(domElement.find('p'),url);
         
          callback(response);
        }
      }  
    );
  },

  makeCopyLink: function(textElement,url) {
    var length = url.length > 6 ? url.length - 6 : url.length;
    var short_id = url.substr(length);
    var a = $('<a id="clip_link" href="'+ url + '"> Copy your link to to the clipboard. ('+ short_id + ')</a>');
    a.css('color','white');
    textElement.html(a);
    if (typeof ZeroClipboard !=='undefined') {
      var clip = new ZeroClipboard.Client();
      clip.setText(url);
      clip.glue('clip_link');
      clip.addEventListener( 'onComplete',function() {
        alert('a link to this diagram is now in your clipboard.');
      });
    }
  },

  loadAuthoredData: function (authoredDocId) {
    this.authoredDocId = authoredDocId;
    var self = this;
    this.loadData(
      authoredDocId, 
      function(response){
        if (response.authored_data){
          self.authoredDocRev = response._rev;
          self.authorContentWindow.MSA.dataController.loadData(response.authored_data);
        }
      }
    );
  },
  
  loadLearnerData: function (learnerDocId) {
    this.learnerDocId = learnerDocId;
    var self = this;
    this.loadData(
      learnerDocId, 
      function(response){
        if (response.learner_data){
          self.learnerDocRev = response._rev;
          
          self.learnerContentWindow.$('#my_system_state').html(JSON.stringify(response.learner_data));
          self.learnerContentWindow.MySystem.updateFromDOM();
        }
      }
    );
  },
  
  saveAuthoring: function () {
    var authoredData = this.authorContentWindow.MSA.dataController.get('dataJson'),
        authoredDataHash = JSON.parse(JSON.stringify(authoredData, null, 2));
        
    var data = {"authored_data": authoredDataHash};

    var self = this;
    this.saveData(
      data, 
      this.authoredDocId,
      this.authoredDocRev,
      function(response){
        self.authoredDocId = response.id;
        self.authoredDocRev = response.rev;
      }
    );

  },
  
  saveLearner: function () {
    var learnerData = this.learnerContentWindow.$('#my_system_state').html(),
        learnerDataHash = JSON.parse(learnerData);

    var data = {"learner_data": learnerDataHash};
    
    var self = this;
    this.saveData(
      data, 
      this.learnerDocId,
      this.learnerDocRev,
      function(response){
        self.learnerDocId = response.id;
        self.learnerDocRev = response.rev;
        self.learnerContentWindow.MySystem.externalSaveSuccessful(true);
      }
    );
  }
  
};
