/**
 * @file Init db for data or config store
 * @author littlewin(littlewin.wang@gmail.com)
 */

import Datastore from 'lowdb'
import LodashId from 'lodash-id'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import fs from 'fs-extra'
import { remote, app } from 'electron'

// renderer process need use remote.app
const APP = process.type === 'renderer' ? remote.app : app
const STORE_PATH = APP.getPath('userData')

// in case file not exist
if (process.type !== 'renderer') {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
}

const adapter = new FileSync(path.join(STORE_PATH, '/data.json'))

const db = Datastore(adapter)
db._.mixin(LodashId)

if (!db.has('projects').value()) {
  db.set('projects', []).write()
}

export default db
