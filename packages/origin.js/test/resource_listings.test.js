import { expect } from "chai"
import Listings from "../src/resources/listings.js"
import ContractService from "../src/contract-service.js"
import IpfsService from "../src/ipfs-service.js"
import Web3 from 'web3'

describe("Listing Resource", function() {
  this.timeout(5000) // default is 2000

  var listings
  var contractService
  var ipfsService
  var testListingIds

  before(async () => {
    let provider = new Web3.providers.HttpProvider('http://localhost:9545')
    let web3 = new Web3(provider)
    contractService = new ContractService({ web3 })
    ipfsService = new IpfsService()
    listings = new Listings({ contractService, ipfsService })
    testListingIds = await contractService.getAllListingIds()

    // Ensure that there are at least 2 sample listings
    await listings.create({ name: "Sample Listing 1", price: 1 }, "")
    await listings.create({ name: "Sample Listing 2", price: 1 }, "")
  })

  it("should get all listing ids", async () => {
    const ids = await listings.allIds()
    expect(ids.length).to.be.greaterThan(1)
  })

  it("should get a listing", async () => {
    await listings.create({ name: "Foo Bar", price: 1 }, "")
    let listingIds = await contractService.getAllListingIds()
    const listing = await listings.getByIndex(listingIds[listingIds.length - 1])
    expect(listing.name).to.equal("Foo Bar")
    expect(listing.index).to.equal(listingIds.length - 1)
  })

  it("should buy a listing", async () => {
    await listings.create({ name: "My Listing", price: 1 }, "")
    let listingIds = await contractService.getAllListingIds()
    const listing = await listings.getByIndex(listingIds[listingIds.length - 1])
    const transaction = await listings.buy(
      listing.address,
      1,
      listing.price * 1
    )
  })

  it("should create a listing", async () => {
    const listingData = {
      name: "1972 Geo Metro 255K",
      category: "Cars & Trucks",
      location: "New York City",
      description:
        "The American auto-show highlight reel will be disproportionately concentrated on the happenings in New York.",
      pictures: undefined,
      price: 3.3
    }
    const schema = "for-sale"
    await listings.create(listingData, schema)
    // Todo: Check that this worked after we have web3 approvals working
  })
})
