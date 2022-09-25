import {DynamoDb} from "./db-helper";

function accounts() {
    DynamoDb.createTable({
        TableName: "accounts",
        KeySchema: [
            {
                AttributeName: "discordId",
                KeyType: "HASH"
            },
        ],
        AttributeDefinitions: [
            {
                AttributeName: "discordId",
                AttributeType: "S"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 1
        }
    }).catch(error => {
        console.error(error)
    })
}

function teams() {
    DynamoDb.createTable({
        TableName: "teams",
        KeySchema: [
            {
                AttributeName: "id",
                KeyType: "HASH"
            },
        ],
        AttributeDefinitions: [
            {
                AttributeName: "id",
                AttributeType: "S"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    }).catch(error => {
        console.error(error)
    })
}

function tournaments() {
    DynamoDb.createTable({
        TableName: "teams",
        KeySchema: [
            {
                AttributeName: "id",
                KeyType: "HASH"
            },
        ],
        AttributeDefinitions: [
            {
                AttributeName: "id",
                AttributeType: "S"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    }).catch(error => {
        console.error(error)
    })
}

export default async function init() {
    accounts();
    teams();
    tournaments();
}
