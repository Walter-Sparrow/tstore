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

export namespace model {
	
	export class FileRecord {
	    name: string;
	    state: number;
	    description: string;
	    size: number;
	    checksum: string;
	    // Go type: time
	    uploaded_at: any;
	    chunk_ids: string[];
	
	    static createFrom(source: any = {}) {
	        return new FileRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.state = source["state"];
	        this.description = source["description"];
	        this.size = source["size"];
	        this.checksum = source["checksum"];
	        this.uploaded_at = this.convertValues(source["uploaded_at"], null);
	        this.chunk_ids = source["chunk_ids"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

