export namespace config {
	
	export class Config {
	    bot_token: string;
	    chat_id: string;
	    sync_folder: string;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bot_token = source["bot_token"];
	        this.chat_id = source["chat_id"];
	        this.sync_folder = source["sync_folder"];
	    }
	}

}

