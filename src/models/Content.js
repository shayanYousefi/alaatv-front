import { Model, Collection } from 'js-abstract-model'
import { SetList } from './Set'
import Url from './Url'
import { ContentTimePointList } from './ContentTimePoint'
import ContentSection from './ContentSection'

class Content extends Model {
  constructor(data) {
    super(data, [
      {
        key: 'url_key',
        value: function () {
          return 'content'
        }
      },
      { key: 'id' },
      { key: 'content_id' },
      { key: 'apiUrl' },
      { key: 'author' },
      { key: 'author_id' },
      { key: 'content_type' },
      { key: 'contenttype_id' },
      { key: 'context' },
      {
        key: 'comments',
        default: []
      },
      { key: 'description' },
      { key: 'lesson_name' },
      { key: 'lesson' },
      { key: 'can_see' },
      { key: 'color' },
      { key: 'start' },
      { key: 'end' },
      { key: 'display' },
      { key: 'duration' },
      { key: 'hls' },
      {
        key: 'file',
        default: {
          pamphlet: [],
          video: []
        }
      },
      {
        key: 'stream',
        default: {
          video: []
        }
      },
      { key: 'is_free' },
      { key: 'is_favored' },
      { key: 'title' },
      { key: 'body' },
      { key: 'short_title' },
      { key: 'type' }, // 1=> pamphlet, 8=> video
      { key: 'photo' },
      { key: 'forrest_tags' },
      { key: 'forrest_trees' },
      { key: 'forrest_tree_tags' },
      { key: 'nextApiUrl' },
      { key: 'nextUrl' },
      { key: 'order' },
      { key: 'page_view' },
      { key: 'previousApiUrl' },
      { key: 'previousUrl' },
      { key: 'redirectUrl' },
      { key: 'section_id' },
      { key: 'is_current' },
      { key: 'has_watched' },
      { key: 'set' },
      { key: 'major' },
      {
        key: 'timepoints',
        relatedModel: ContentTimePointList
      },
      {
        key: 'section',
        relatedModel: ContentSection
      },
      // {
      //     key: 'set',
      //     relatedModel: Set,
      // },
      { key: 'tags' },
      { key: 'thumbnail' },
      { key: 'tmp_description' },
      {
        key: 'url',
        relatedModel: Url
      },
      { key: 'favor_url' },
      { key: 'unfavor_url' },
      { key: 'created_at' },
      { key: 'updated_at' }
    ])

    // ToDo: must remove
    if (this.file && this.file.video) {
      this.file.video.forEach((item, key) => {
        this.file.video[key].link = this.file.video[key].link.replace('download=1', '')
      })
    }
  }

  getHlsSource() {
    return this.hls
  }

  getOrginalMp4Source() {
    if (!this.stream?.video || this.stream.video.length === 0) {
      return null
    }

    const target = this.stream.video.find(video => video.ext === 'mp4')

    if (!target) {
      return null
    }

    return target
  }

  getWebmSource() {
    if (!this.stream?.video || this.stream.video.length === 0) {
      return null
    }

    const target = this.stream.video.find(video => video.ext === 'webm')

    if (!target) {
      return null
    }

    return target
  }

  getOldVideoSource() {
    if (!this.file?.video || this.file.video.length === 0) {
      return null
    }
    return this.file.video.map(item => {
      item.src = item.link
      item.type = item.ext
      item.label = item.caption
      return item
    })[0].src

    // return [
    //   {
    //     src: 'https://nodes.alaatv.com/media/1374/HD_720p/1374002okij.mp4',
    //     type: 'mp4',
    //     label: 'کیفیت عالی'
    //   },
    //   {
    //     src: 'https://nodes.alaatv.com/media/1374/hq/1374002okij.mp4',
    //     type: 'mp4',
    //     label: 'کیفیت بالا'
    //   },
    //   {
    //     src: 'https://nodes.alaatv.com/media/1374/240p/1374002okij.mp4',
    //     type: 'mp4',
    //     label: 'کیفیت متوسط'
    //   }][0].src
  }

  getVideoSource() {
    const hlsSource = this.getHlsSource()
    const oldVideoSource = this.getOldVideoSource()
    const webmSource = this.getWebmSource()
    const orginalMp4Source = this.getOrginalMp4Source()
    if (hlsSource) {
      return hlsSource
    }
    if (oldVideoSource) {
      return oldVideoSource
    }
    if (webmSource) {
      return webmSource
    }
    if (orginalMp4Source) {
      return orginalMp4Source
    }
  }

  set() {
    return new SetList(this.inputData.set)
  }

  createFavorUrl(baseUrl, favored) {
    return baseUrl + '/c/' + this.id + '/' + ((favored) ? 'favored' : 'unfavored')
  }

  setFavor(url) {
    if (typeof url === 'undefined') {
      url = this.favor_url
    }
    if (url === null) {
      console.error('url is null.')
    }
    return this.crud.create(url)
  }

  setUnfavor(url) {
    if (typeof url === 'undefined') {
      url = this.unfavor_url
    }
    if (url === null) {
      console.error('url is null.')
    }
    return this.crud.create(url)
  }

  isPamphlet() {
    return this.type === 1
  }

  isVideo() {
    return this.type === 8
  }
}

class ContentList extends Collection {
  model() {
    return Content
  }

  getType(type) {
    return this.list.filter(item => parseInt(item.type) === parseInt(type))
  }

  sortByOrder(sort) {
    this.list.sort(function (a, b) {
      if (isNaN(a.order) || a.order === null || isNaN(b.order) || b.order === null) {
        return 1
      }
      if (sort === 'asc') {
        return a.order - b.order
      } else if (sort === 'des') {
        return b.order - a.order
      }

      return false
    })
  }

  videos(sort) {
    if (typeof sort !== 'undefined') {
      this.sortByOrder(sort)
    }
    return this.getType(8)
  }

  pamphlets(sort) {
    if (typeof sort !== 'undefined') {
      // this.sortByOrder(sort);
    }
    return this.getType(1)
  }

  getSections() {
    return this.list.filter((value, index, self) => self.findIndex((element) => element.section.id === value.section.id) === index).map((item) => item.section)
  }
}

export { Content, ContentList }
