import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FormattedMessage, FormattedNumber } from 'react-intl'
import Pagination from 'react-js-pagination'
import { withRouter } from 'react-router'

import { getListingIds } from 'actions/Listing'

import { LISTINGS_PER_PAGE } from 'components/constants'
import ListingCard from 'components/listing-card'

import getCurrentNetwork from '../utils/currentNetwork'
import origin from '../services/origin'
const web3 = origin.contractService.web3

//had to create a HOC for FormattedMessage since it cannot statically evaluate dynamic data
const FormattedMessageFixed = props => {
  return <FormattedMessage {...props} />
}


class ListingsGrid extends Component {
  constructor(props) {
    super(props)
    this.state = {
      network: 'this network',
      networkError: null,
      networkId: null
    }
    this.handleOnChange = this.handleOnChange.bind(this)
  }

  componentWillMount() {
    if (this.props.renderMode === 'home-page') this.props.getListingIds()
    this.fetchNetwork()
  }

  
  async fetchNetwork() {
    const providerExists = web3.currentProvider
    const networkConnected =
      web3.currentProvider.connected ||
      (typeof web3.currentProvider.isConnected === 'function' &&
        web3.currentProvider.isConnected())

    providerExists &&
      networkConnected &&
      web3.version &&
      (await web3.eth.net.getId((err, netId) => {
        const networkId = parseInt(netId, 10)

        if (err) {
          this.setState({
            networkError: err
          })
        } else {
          if (networkId !== this.state.networkId) {
            

            this.setState({
              networkId,
              network: getCurrentNetwork(networkId).name
            })
          }
        }
      }))
  }

  handleOnChange(page) {
    if (this.props.renderMode === 'home-page') {
      this.props.history.push(`/page/${page}`)
    } else {
      this.props.handleChangePage(page)
    }
  }

  render() {
    const { contractFound, listingIds, search, featuredListingIds, hiddenListingIds } = this.props
    let activePage, currentPageListingIds, includedFeaturedListingIds, listingIdsNotHidden, resultsCount

    if (this.props.renderMode === 'home-page') {
      listingIdsNotHidden = listingIds.filter(id => !hiddenListingIds.includes(id))
      // prevent featured listings from appearing twice
      const listingIdsNeitherHiddenNorFeatured = listingIdsNotHidden
        .filter(id => !featuredListingIds.includes(id))

      activePage = parseInt(this.props.match.params.activePage) || 1
      includedFeaturedListingIds = activePage === 1 ? featuredListingIds : []

      /* Calc listings to show for given page. Example of start/end slice positions when there are
       * 4 featured listings:
       * Page number   sliceStart     sliceEnd
       *     1             0              8
       *     2             8              20
       *     3             20             32
       */
      const startSlicePosition = Math.max(0, LISTINGS_PER_PAGE * (activePage - 1) - featuredListingIds.length)
      currentPageListingIds = listingIdsNeitherHiddenNorFeatured.slice(
        startSlicePosition,
        Math.max(0, startSlicePosition + LISTINGS_PER_PAGE - includedFeaturedListingIds.length)
      )
      currentPageListingIds = [...includedFeaturedListingIds, ...currentPageListingIds]
      resultsCount = listingIdsNotHidden.length
    } else if (this.props.renderMode === 'search') {
      listingIdsNotHidden = search.listingIds.filter(id => !hiddenListingIds.includes(id))
      currentPageListingIds = listingIdsNotHidden.sort((a, b) => {
        const aIsFeatured = featuredListingIds.includes(a)
        const bIsFeatured = featuredListingIds.includes(b)
        // if only one is featured, place it earlier in results
        if (aIsFeatured !== bIsFeatured) {
          return aIsFeatured ? -1 : 1
        }
        // otherwise sort in descending order of id
        if (a < b) {
          return 1
        } else {
          return -1
        }
      })
      activePage = this.props.searchPage
      resultsCount = search.listingsLength - hiddenListingIds.length
    }

    const network = this.state.network

    return (
      <div className="listings-wrapper">
        {contractFound === false && (
          <div className="listings-grid">
            <div className="alert alert-warning" role="alert">
              <FormattedMessageFixed
                id={'listings-grid.originContractNotFound'}
                defaultMessage={
                  'No Origin listing contracts were found on ' + network + '.'
                }
              />
              <br />
              <FormattedMessage
                id={'listings-grid.changeNetworks'}
                defaultMessage={
                  'You may need to change networks, or deploy the contracts.'
                }
              />
            </div>
          </div>
        )}
        {contractFound && (
          <div className="listings-grid">
            {resultsCount > 0 && (
              <h1>
                <FormattedMessage
                  id={'listings-grid.listingsCount'}
                  defaultMessage={'{listingIdsCount} Listings'}
                  values={{
                    listingIdsCount: (
                      <FormattedNumber value={resultsCount} />
                    )
                  }}
                />
              </h1>
            )}
            <div className="row">
              {currentPageListingIds.map(id => (
                <ListingCard
                  listingId={id}
                  key={id}
                  featured={featuredListingIds.includes(id)}
                />
              ))}
            </div>
            <Pagination
              activePage={parseInt(activePage)}
              itemsCountPerPage={LISTINGS_PER_PAGE}
              totalItemsCount={resultsCount}
              pageRangeDisplayed={5}
              onChange={this.handleOnChange}
              itemClass="page-item"
              linkClass="page-link"
              hideDisabled="true"
            />
          </div>
        )}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  contractFound: state.listings.contractFound,
  featuredListingIds: state.listings.featured,
  hiddenListingIds: state.listings.hidden,
  listingIds: state.marketplace.ids
})

const mapDispatchToProps = dispatch => ({
  getListingIds: () => dispatch(getListingIds())
})

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ListingsGrid)
)
