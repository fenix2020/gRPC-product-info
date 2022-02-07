const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
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
const server = new grpc.Server();

let products = [
    { id: 1, name: "Name product 1", description: "Description for product 1" },
    { id: 2, name: "Name product 2", description: "Description for product 2" },
    { id: 3, name: "Name product 3", description: "Description for product 3" },
];


const addProduct = (call, callback) => {
    const product = call.request;
    product.id = products[products.length - 1].id + 1;
    products.push(product);
    return callback(null, { value: product.id });
};

const getProduct = (call, callback) => {
    const productId = call.request.value;
    const product = products.filter(el => el.id == productId);
    if (product[0]) {
        return callback(null, product[0]);
    } else {
        return callback(Error('Product not found!'));
    }
};

const searchProducts = (call) => {
    const search = call.request.search;

    products.map((product) => {
        if (product.name.includes(search)) {
            call.write(product);
        }
    });
    call.end();
};

const addSomeProducts = (call, callback) => {
    let addedIds = [];

    call.on('data', (product) => {
        product.id = products[products.length - 1].id + 1;
        products.push(product);
        addedIds.push(product.id);
    });

    call.on('end', () => {
        callback(null, { value: addedIds });
    });
};

const updateProducts = (call) => {
    call.on('data', (product) => {
        const updateProduct = products.find(prod => prod.id === product.id);
        updateProduct.name = product.name;
        updateProduct.description = product.description;
        call.write(updateProduct);
    });
    call.on('end', () => {
        call.end();
    });
};

server.addService(productService.ProductInfo.service, {
    addProduct: addProduct,
    getProduct: getProduct,
    searchProducts: searchProducts,
    addSomeProducts: addSomeProducts,
    updateProducts: updateProducts
});

server.bindAsync(
    "127.0.0.1:50051",
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
        console.log("Server running at http://127.0.0.1:50051");
        server.start();
    }
);