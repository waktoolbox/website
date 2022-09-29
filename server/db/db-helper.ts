import {
    CreateTableCommand,
    CreateTableCommandInput,
    CreateTableCommandOutput,
    DynamoDBClient,
    ListTablesCommand
} from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    GetCommandOutput,
    PutCommand,
    PutCommandOutput,
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    UpdateCommand,
    UpdateCommandOutput
} from "@aws-sdk/lib-dynamodb";
import init from "./db-populate-tables";

class DynamoWrapper {
    private client?: DynamoDBClient;
    private db?: DynamoDBDocumentClient;
    private readonly tables: Set<string> = new Set();
    private isInit: boolean = false;

    init() {
        this.client = new DynamoDBClient({
            endpoint: process.env.DYNAMO_URL,
            region: process.env.DYNAMO_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY || "",
                secretAccessKey: process.env.AWS_SECRET_KEY || ""
            }
        });
        this.db = DynamoDBDocumentClient.from(this.client, {
            marshallOptions: {
                convertEmptyValues: false,
                removeUndefinedValues: true,
                convertClassInstanceToMap: true
            }
        });

        this.db.send(new ListTablesCommand({})).then(async tables => {
            tables.TableNames?.forEach(name => this.tables.add(name));
            await init();
        })
        this.isInit = true;
    }

    put(table: string, obj: any): Promise<PutCommandOutput> {
        if (!this.isInit) this.init();
        return new Promise((resolve, reject) => {
            this.db?.send(new PutCommand({
                TableName: table,
                Item: obj
            }))
                .then(data => resolve(data))
                .catch(error => {
                    console.error(error);
                    reject(error)
                })
        })
    }

    get(table: string, id: string): Promise<GetCommandOutput> {
        if (!this.isInit) this.init();
        return new Promise((resolve, reject) => {
            this.db?.send(new GetCommand({
                TableName: table,
                Key: {
                    id: id
                }
            }))
                .then(data => resolve(data))
                .catch(error => {
                    console.error(error);
                    reject(error)
                })
        })
    }

    update(table: string, id: string, data: any): Promise<UpdateCommandOutput> {
        if (!this.isInit) this.init();
        return new Promise((resolve, reject) => {
            let expr = "set ";
            const names: any = {}
            const values: any = {}
            const entries = Object.entries(data);
            if (entries.length == null) {
                reject();
            }
            entries.forEach(([key, value]) => {
                expr += `#${key} = :${key}, `
                names[`#${key}`] = key;
                values[`:${key}`] = value;
            })
            this.db?.send(new UpdateCommand({
                TableName: table,
                Key: {
                    id: id
                },
                UpdateExpression: expr.substring(0, expr.length - 2),
                ExpressionAttributeNames: names,
                ExpressionAttributeValues: values
            }))
                .then(data => resolve(data))
                .catch(error => {
                    console.error(error);
                    reject(error)
                })
        })
    }

    query(command: QueryCommandInput): Promise<QueryCommandOutput> {
        if (!this.isInit) this.init();
        return new Promise((resolve, reject) => {
            this.db?.send(new QueryCommand(command))
                .then(data => resolve(data))
                .catch(error => {
                    console.error(error);
                    reject(error)
                })
        })
    }

    createTable(params: CreateTableCommandInput): Promise<CreateTableCommandOutput> {
        if (!this.isInit) this.init();
        return new Promise((resolve, reject) => {
            if (this.tables.has(params.TableName || "")) return resolve({} as CreateTableCommandOutput);
            this.db?.send(new CreateTableCommand(params))
                .then(data => resolve(data))
                .catch(error => {
                    console.error(error);
                    reject(error)
                })
        })
    }
}

export const DynamoDb = new DynamoWrapper();