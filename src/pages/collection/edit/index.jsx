/*
Bugs
  - As per webpack online bundle analyzer, even 'Label' and 'image' are being imported?!
 */
import React from 'react'
import {BrowserRouter, Route, Switch, Redirect, NavLink} from 'react-router-dom'
import {connect} from 'react-redux'
import isEmpty from 'lodash.isempty'
import {checkOwns, pushOwns} from 'modules/user'

import Modal from 'semantic-ui-react/dist/commonjs/modules/Modal/Modal.js'
import Add from './Add'
import Movies from './Movies'
import Errors from './Errors'
import Settings from './Settings'

@connect((store) => {
  return {
    id: store.fetch.collection.id,
    secret: store.fetch.collection.secret
  }
})
export default class Edit extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      doesOwn: checkOwns(props.id)
    }
  }
  _checkSecret(event){
    if (event.target.value === this.props.secret){
      pushOwns(this.props.id)
      this.setState({doesOwn: true})
    }
  }
  render () {
    if (!this.state.doesOwn){
      return(
        <Modal open={true} basic size='small'>
          <div class="header">Authorize</div>
          <div class="content">
            <div class="ui form">
              <div class="field">
                <label>Enter secret</label>
                <input type="text" placeholder='bazgina!' onChange={this._checkSecret.bind(this)} />
              </div>
            </div>
          </div>
        </Modal>
      )
    }
    return (
      <Switch>
        <Route exact path={`${this.props.match.url}/add`} component={Add} />
        <Route exact path={`${this.props.match.url}/movies/:title?`} component={Movies} />
        <Route exact path={`${this.props.match.url}/errors/:title?`} component={Errors} />
        <Route exact path={`${this.props.match.url}/settings`} component={Settings} />
      </Switch>
    )
  }
}

class ClosestTitles extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      title: this.props.title,
      isFetching: true,
      hits: null,
      success: false,
      error: false,
      errorMessage: null
    }
  }

  render () {
    if (this.state.isFetching) {
      return (
        <div class='ui three column divided center aligned grid'>
          {[...Array(3).keys()].map((a, i) =>
            <div class='column' key={componentKey++} />
          )}
        </div>
      )
    }

    if (this.state.error) {
      return (
        <div class='ui one column center aligned grid'>
          <div class='column'>
            {this.state.errorMessage}
          </div>
        </div>
      )
    }

    if (this.state.hits.length === 0) {
      return (
        <div class='ui one column center aligned grid'>
          <div class='column'>
            No results found for {this.state.title}.
          </div>
        </div>
      )
    }

    const hits = this.state.hits
    const maxResults = (hits.length < 3) ? hits.length : 3
    const columnCount = (maxResults === 3) ? 'three' : ((maxResults === 2) ? 'two' : 'one')

    return (
      <div class={`ui ${columnCount} column divided center aligned grid`}>
        {hits.slice(0, maxResults).map((hit, i) => {
          return (
            <div class='column' key={componentKey++}>
              <h4 class='ui header'>{hit._source.title}</h4>
              <Poster posterPath={hit._source.poster} tmdbSize='w58_and_h87_bestv2' alt={hit._source.title} />
              <p><b>XX</b> distance with {hit._source.title.votes} votes</p>
              <div class='ui button'>Choose</div>
            </div>
          )
        })}
      </div>
    )
  }

  componentDidMount () {
    fetch(`//${process.env.API_HOST}/process/search?input=${encodeURIComponent(this.state.title)}&index=tmdb&type=movie&mode=match`)
      .then((response) => {
        if (response.status !== 200) throw new Error(`API server status error: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (!data.success) throw new Error(data.message)
        console.log('Closest:', data)
        this.setState({isFetching: false, success: true, hits: data.elasticsearch.hits, error: false, errorMessage: null})
      })
      .catch((err) => {
        console.log('Closest', err.message)
        this.setState({isFetching: false, success: false, results: {}, error: true, errorMessage: err.message})
      })
  }
}
