const PROM = require('./UtilProm.js');

class BotHandler {
  
  /* @param bot is the DiscordBot instance to which we will give these handlers */
  constructor( _client ) {
    this.client = _client;
  }
  
  /* ====================================
       Connection Events
     ================================== */
  onReady() {
    PROM.log( 'fluff', this.client.config.bot.name );
  }  
  onDisconnect( event ) {  }
  onReconnecting(  ) {  }
  onResume( numReplayed ) {  }
  onGuildUnavailable( guild ) {  }
  
  
  /* ====================================
       Debug Events
     ================================== */
  onWarn( info ) { 
    if (info) {
      let d = new Date();
      PROM.log( 'discord_fluff', `${d.toLocaleString()} [WARNING] ${info}` );
    }
  }
  onDebug( info ) { 
    if (info) {
      let d = new Date();
      PROM.log( 'discord_fluff', `${d.toLocaleString()} [DEBUG] ${info}` );
    }
  }
  onError( error ) { 
    if (error) {
      let d = new Date();
      PROM.log( 'discord_core', `${d.toLocaleString()} [ERROR] ${error.code}\n${error.message}` );
    }
  }
  
  
  /* ====================================
       User Activity Events
     ================================== */
  onMessage( msg ) {    
    // Ignore messages from DMs, Group DMs, and Voice
    if (msg.channel.type != "text") return;
    // Ignore bot messages
    if (msg.author.bot) return;
    
    PROM.log( 'fluff', `Received msg: ${msg.content}` );
    
    let guildConfig = ( msg.guild.id == this.client.config.master.guildID ) ? this.client.config.master : this.client.config.guild;
    
    // If guild is configured, process messages; Otherwise configure it in database
    this.client.database.get( `G:${msg.guild.id}|config`, {valueEncoding:'json'} )
      .then( 
        (config) => { this.processMessage(msg,config); },
        (err) => { 
          if (err.name === "NotFoundError") { this.initializer(msg.guild,guildConfig); }
          else { PROM.errorHandler(err); }
        }
      )
      .catch( PROM.errorHandler );
  }
  onMessageDelete( msg ) {  }
  onMessageUpdate( oldMsg, newMsg ) {  }
  
  
  onPresenceUpdate( oldMember, newMember ) {  }
  onGuildMemberUpdate( oldMember, newMember ) {  }
  
  
  /* ====================================
       Admin Role Events
     ================================== */
  onRoleCreate( role ) {  }
  onRoleDelete( role ) {  }
  onRoleUpdate( oldRole, newRole ) {  }
  
  
  /* ====================================
       Admin Channel Events
     ================================== */
  onChannelCreate( channel ) {  }
  onChannelDelete( channel ) {  }
  onChannelUpdate( oldChannel, newChannel ) {  }
  
  
  /* ====================================
       Admin Guild Events
     ================================== */
  onGuildCreate( guild ) {  }
  onGuildDelete( guild ) {  }
  onGuildUpdate( oldGuild, newGuild ) {  }
  
  
  onGuildMemberAdd( member ){  }
  onGuildMemberRemove( member ){  }
  
  
  onGuildBanAdd( guild, user ){  }
  onGuildBanRemove( guild, user ){  }
  
  
  
  /* ====================================
       Helper Functions
     ================================== */
  processGuildStatus( status, msg, config ) {
    switch(status) {
      case this.client.constants.GuildState.UNAPPROVED:
        this.initializer(msg.guild, config);
        break;
        
      case this.client.constants.GuildState.PENDING_APPROVAL:
        // Ignore anything here not sent by master
        break;
        
      case this.client.constants.GuildState.APPROVED:
        // Ignore every channel except botadmin
        this.client.database.get(`G:${msg.guild.id}|C:botadmin`)
          .then( (channelID) => { 
            if (channelID == msg.channel.id) {
              return processInitCommands(msg,config);
            } else {
              return;
            }
          } )
          // TODO: handle case where botadmin does not exist
          .catch( PROM.errorHandler );
        break;
        
      case this.client.constants.GuildState.INITIALIZING_ROLES:
        break;
        
      case this.client.constants.GuildState.INITIALIZING_COMMANDS:
        break;
        
      case this.client.constants.GuildState.INITIALIZING_CHANNELS:
        break;
        
      case this.client.constants.GuildState.INITIALIZING_WEBHOOKS:
        break;
        
      case this.client.constants.GuildState.INITIALIZING_EXTRA:
        break;
      
      case this.client.constants.GuildState.READY_TO_USE:
      default:
        // Accept any valid command and process it
        this.processMessage(msg, config);
        break;
    }
  }
  
  initializer( guild, config ) {
    
    // Add guild to database
    this.client.database.put(`G:${guild.id}|config`, config.configurable, {valueEncoding:'json'})
      .then( () => { PROM.log('core', 'Added guild to db') } )
      .catch( PROM.errorHandler );
    
    // Create an admin-only, bot-only channel for managing the bot
    
      // Send the channel a welcome message, explaining security and to wait for admin approval, invitation to master bot channel
    
      // Send master server a request on behalf of this guild
    
      // Update status to pending approval

      // Invite admin to master bot channel
    
    // If bot failes to create unique channel, send a message to general requesting admin specify a bot-only channel
    
  }
  
  /* Enable admin to initialize bot-guild settings with:     
     INIT AUTO
     INIT MANUAL
     SET ROLE LABEL (-F)
     CREATE ROLE LABEL (name)
     CONTINUE
     SET CHANNEL LABEL (-F)
     CREATE CHANNEL LABEL (name)     
     SHOW SETUP (destination)
     SHOW COMMANDS (destination)
     PREFIX prefix
  */
  processInitCommands( msg, config ) {
    
  }
  
  /* Enable anyone authorized in the acceptable channel to use the following:
     (M) !ALLOW
     (M) !DENY
     (A) !INIT
     (A) !PREFIX
     (A) !SHOW
     !PING
     !TEST
  */
  processMessage( msg, config ){
    let cleanedMsg = msg.content.trim();
    // Only read messages starting with command prefix
    if (cleanedMsg.startsWith(config.prefix.value)) {
      // Parse out the command from message args
      let [cmd, ...arg] = cleanedMsg.substr(config.prefix.value.length).trim().split(" ");
      // Only process command if it is recognized
      // TODO: check role/commandsets for restricted command actions
      cmd = cmd.toLowerCase();
      if ( this.client.command._hasMethod( cmd ) ) {
        this.client.command[cmd](msg, arg, config);
      }
    }
    // TODO: consider inline commands for reaction images or mentioning bot entities
    
  }
  
}

module.exports = BotHandler;