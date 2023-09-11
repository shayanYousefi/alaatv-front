import { boot } from 'quasar/wrappers'
import { APIGateway } from 'src/api/APIGateway.js'
import { CapacitorSQLite } from '@capacitor-community/sqlite'
import { Preferences } from '@capacitor/preferences'

const oldDbName = 'AlaaDatabase'
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    CapacitorSQLite.addSQLiteSuffix({
      dbNameList: [oldDbName]
    })
      .then(() => {
        CapacitorSQLite.createConnection({
          database: oldDbName,
          version: 20,
          encrypted: false
        })
          .then(() => {
            CapacitorSQLite.open({
              database: oldDbName,
              version: 20,
              encrypted: false
            })
              .then(() => {
                resolve()
              })
              .catch(() => {
                reject()
              })
          })
          .catch(() => {
            reject()
          })
      })
      .catch(() => {
        reject()
      })
  })
}

const fetchValuesFromTable = (tableName) => {
  return new Promise((resolve, reject) => {
    const selectAllQuery = 'select * from ' + tableName
    CapacitorSQLite.query({
      database: oldDbName,
      statement: selectAllQuery,
      values: []
    })
      .then((result) => {
        resolve(result.values)
      })
      .catch((error) => {
        console.error('Error in fetch ' + tableName)
        reject(error)
      })
  })
}

const mergeWatchedContentTables = (completedSeenContent, contentWatchTime) => {
  const merged = JSON.parse(JSON.stringify(completedSeenContent))
  contentWatchTime.forEach(cwt => {
    const result = {
      watchable_id: cwt.contentId,
      seconds_watched: parseInt(cwt.pauseTime),
      completely_watched: 0
    }
    const targetInMerged = merged.findIndex(item => item.id === cwt.contentId)
    if (targetInMerged !== -1) {
      result.completely_watched = 1
      merged[targetInMerged].result = result
    } else {
      merged.push({ result })
    }
  })
  merged.forEach((item, index) => {
    if (!item.result) {
      merged[index].result = {
        watchable_id: item.content_id,
        seconds_watched: null,
        completely_watched: 1
      }
    }
  })

  return merged.map(item => item.result)
}

const mergeBookmarkedTables = (bookmarks, customBookMarks, bookMarkFolders) => {
  const resultBookmarks = []
  bookMarkFolders.forEach(folderItem => {
    const bookmarkFolderItem = {
      title: folderItem.folderName,
      order: folderItem.order,
      favors: []
    }
    const targetCustomBookMarks = customBookMarks.filter(cBookmark => cBookmark.bookmarkFolderId === folderItem.id)
    const targetCustomBookMarksIds = targetCustomBookMarks.map(item => item.id)
    const targetBookmarks = bookmarks.filter(b => targetCustomBookMarksIds.includes(b.id))
    bookmarkFolderItem.favors = targetBookmarks.map(item => {
      return {
        id: item.id,
        type: item.type
      }
    })
    resultBookmarks.push(bookmarkFolderItem)
  })
  return resultBookmarks
}

const setSharedKeyDatabase = async () => {
  await Preferences.set({
    key: 'AlaaTvDatabase',
    value: 'DataIsSent'
  })
}

const checkSharedKeyDatabase = async () => {
  const { value } = await Preferences.get({ key: 'AlaaTvDatabase' })
  return value
}

const tables = [
  'bookmark',
  'customBookMark',
  'bookMarkFolders',
  'contentWatchTime',
  'completedSeenContent'
]
export default boot(({ store }) => {
  const oldDbData = {}
  const promises = []
  const user = store.getters['Auth/user']
  const userId = user.id
  const userAgent = window.navigator.userAgent
  checkSharedKeyDatabase()
    .then((value) => {
      console.error('value is : ', value)
      if ((value && value === 'DataIsSent') || !userId) {
        return
      }
      initializeDatabase()
        .then(() => {
          tables.forEach(tableName => {
            promises.push(new Promise((resolve, reject) => {
              fetchValuesFromTable(tableName)
                .then((values) => {
                  oldDbData[tableName] = values
                  resolve()
                })
                .catch(() => {
                  reject()
                })
            }))
          })
          Promise.all(promises)
            .then((values) => {
              CapacitorSQLite.close({
                database: oldDbName
              })
              const sendData = {
                user_id: userId,
                watches: mergeWatchedContentTables(oldDbData.completedSeenContent, oldDbData.contentWatchTime),
                bookmark: mergeBookmarkedTables(oldDbData.bookmark, oldDbData.customBookMark, oldDbData.bookMarkFolders)
              }
              APIGateway.user.sendOldAndroidDatabase({
                key: userAgent,
                value: JSON.stringify(sendData)
              })
                .then(() => {
                  // ToDo: remove old database file
                  setSharedKeyDatabase().then(() => {
                    console.error('sharedKey set Successfully!')
                  }).catch()
                  console.error('Old Native Database sent successfully!', JSON.stringify(sendData))
                })
                .catch(() => {
                  console.error('Error sending data!', JSON.stringify(sendData))
                })
            })
            .catch(() => {
              CapacitorSQLite.close({
                database: oldDbName
              })
              console.error('Error in fetch values')
            })
        })
        .catch(() => {
          console.error('Error in initializeDatabase')
        })
    }).catch()
})
