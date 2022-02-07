const grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
const PROTO_PATH = __dirname + "/product.proto";

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    });
const productService = grpc.loadPackageDefinition(packageDefinition).service;

const client = new productService.ProductInfo('localhost:50051', grpc.credentials.createInsecure());

client.getProduct({ value: 1 }, (error, product) => {
    if (error) {
        throw error.details;
    }
    console.log("Product found: ", product);
});

client.addProduct({ name: "Name product 3", description: "Description for product 3" }, (error, productId) => {
    if (error) {
        throw error.details;
    }
    console.log("Id new product: ", productId.value);
});

const runSearchProducts = (search) => {
    const call = client.searchProducts({ search });
    let products = [];
    call.on('data', (product) => {
        products.push(product);
    });

    call.on('end', () => {
        console.log(products);
    });
}

const runAddSomeProducts = () => {
    const call = client.addSomeProducts((error, productIds) => {
        console.log(productIds);
    });
    for (let i = 0; i < 10; i++) {
        const product = {
            name: `Product ${i}`,
            description: `Description for product ${i}`
        };
        call.write(product);
    }
    call.end();
}

const runUpdateProducts = () =>{
    const call = client.updateProducts();
    call.on('data',(product)=>{
        console.log('Your updated product: ',product);
    });
    call.on('end',()=>{
        console.log('Update completed');
    });
    for (let i = 0; i < 3; i++) {
        const product = {
            id: i+1,
            name: `Product ${i}`,
            description: `Description for product ${i}`
        };
        call.write(product);
    }
    call.end();
};
runSearchProducts("product 1");
runAddSomeProducts();
runUpdateProducts();