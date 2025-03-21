<template>
  <div class="side-menu-body">
    <q-list class="side-menu-list"
            padding>
      <q-item class="menu-item top-search"
              :class="{'show-hamburger': showHamburger}">
        <div v-if="showHamburger"
             class="drawer-btn hamburger">
          <q-btn icon="ph:list"
                 flat
                 square
                 @click="toggleLeftDrawer" />
        </div>
        <q-input v-model="searchText"
                 class="gray-input search-input no-title"
                 placeholder="جست و جو"
                 @update:model-value ="search(topicsRouteArray)">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-item>
      <template v-if="!productLoading && !setListLoading && topicList.length > 0">
        <menu-item :key="menuKey"
                   :items="topicsRouteArray"
                   :show-child-item-tooltip="true"
                   @item-selected="itemSelected" />
        <q-item v-for="(item, index) in productItems"
                :key="index"
                :active="item.routeName === $route.name"
                class="menu-item">
          <q-btn flat
                 class="full-width menu-item-btn"
                 color="background: #EAEAEA;"
                 :to="(item.routeName) ?{ name: item.routeName, params: item.params }: null"
                 :style="{background: item.name === selectedTopic? '#EAEAEA' : ''}"
                 @click="setSelectedTopic(item.name)">
            <div class="label">{{item.label}}</div>
            <div />
          </q-btn>
        </q-item>
      </template>
      <template v-else>
        <q-item v-for="item in 4"
                :key="item"
                class="menu-item">
          <q-skeleton type="text"
                      class="full-width" />
        </q-item>
      </template>
    </q-list>
  </div>
</template>

<script>
import menuItem from 'src/components/Menu/SideMenu/MenuItem.vue'
import mixinEwano from 'src/components/Widgets/Ewano/mixinEwano.js'

export default {
  name: 'LayoutMenu',
  components: { menuItem },
  mixins: [mixinEwano],
  props: {
    productItems: {
      type: Array,
      default: () => {
        return []
      }
    },
    topicsRouteArray: {
      type: Array,
      default: () => {
        return []
      }
    },
    topicList: {
      type: Array,
      default: () => {
        return []
      }
    },
    selectedTopic: {
      type: String,
      default: () => {
        return ''
      }
    }
  },
  emits: ['itemSelected'],
  data () {
    return {
      menuKey: 0,
      searchText: '',
      clickedProductItem: ''
    }
  },
  computed: {
    showHamburger () {
      return this.$store.getters['AppLayout/showHamburgerBtn'] || this.$q.screen.lt.md
    },
    layoutLeftDrawerVisible () {
      return this.$store.getters['AppLayout/layoutLeftDrawerVisible']
    },
    setListLoading () {
      return this.$store.getters['TripleTitleSet/setListLoading']
    },
    productLoading () {
      return this.$store.getters['TripleTitleSet/productLoading']
    }
  },
  watch: {
    topicList () {
      this.menuKey++
    }
  },
  methods: {
    toggleLeftDrawer () {
      this.$store.commit('AppLayout/updateLayoutLeftDrawerVisible', !this.layoutLeftDrawerVisible)
    },
    itemSelected (topic) {
      const isIframe = window.self !== window.top
      if (this.$q.screen.gt.sm && !isIframe) {
        this.$store.commit('AppLayout/updateLayoutLeftDrawerWidth', 100)
        this.$store.commit('AppLayout/updateLayoutLeftDrawerVisible', true)
      } else {
        this.$store.commit('AppLayout/updateLayoutLeftDrawerWidth', 350)
        this.$store.commit('AppLayout/updateLayoutLeftDrawerVisible', false)
        if (this.isEwanoUser) {
          setTimeout(() => {
            this.$store.commit('AppLayout/updateLayoutLeftDrawerWidth', 350)
            this.$store.commit('AppLayout/updateLayoutLeftDrawerVisible', false)
          }, 100)
        }
      }
      if (!this.$route.params.productId) {
        return
      }
      this.$emit('itemSelected', topic)
      this.$store.commit('TripleTitleSet/updateSelectedTopic', topic.title)
      this.$router.push({
        name: 'UserPanel.Asset.TripleTitleSet.ProductPage',
        params: {
          productId: this.$route.params.productId
        }
      })
    },
    setSelectedTopic (TopicName) {
      this.clickedProductItem = TopicName
    },
    search (list, parentContain = false) {
      // if (!list || list.length === 0) {
      //   return false
      // }
      // if (parentContain) {
      //   return true
      // }
      // let flag = false
      // list.forEach(item => {
      //   const contain = item.title.includes(this.searchText)
      //   if (this.search(item.children, contain) || contain) {
      //     flag = true
      //     item.show = true
      //     item.open = true
      //   } else {
      //     item.open = false
      //     item.show = false
      //   }
      // })
      // return flag
    },
    logOut () {
      return this.$store.dispatch('Auth/logOut')
    }
  }
}
</script>

<style scoped lang="scss">
.side-menu-body {
  height: calc(100vh - 200px);

  .q-list {
    padding: 0;

    &.side-menu-list {
      .top-search {
        .search-input {
          width: 100%;
          margin-bottom: 30px;
        }

        &.show-hamburger {
          $hamburger-width: 40px;
          padding: $space-4 $spacing-none;
          justify-content: center;
          align-items: center;
          .hamburger {
            width: $hamburger-width;
          }
          .search-input {
            justify-content: center;
            align-items: center;
            width: calc( 100% - #{$hamburger-width} );
            margin-bottom: $spacing-none;
          }
        }
      }

      margin-bottom: 109px;
      padding: 0 $space-4;
      max-width: 100%;

      :deep(.menu-item) {
        .list-child-item {
          max-width: 260px;
        }
      }

      .menu-item-btn {
        :deep(.q-btn__content) {
          width: 100%;
          display: grid;
          grid-template-columns: auto auto auto;

          //width: 100%;
          padding: 5px 10px;
          justify-content: normal;

          .label {
            font-weight: 400;
            font-size: 20px ;
            line-height: 28px;
          }
        }
      }

      @media screen and (width <= 1919px) {
        margin-bottom: $space-7;
      }

      @media screen and (width <= 1439px) {
        margin-bottom: $space-6;
      }

      @media screen and (width <= 599px) {
        margin-bottom: $space-2;
      }

      .top-separator {
        margin: 0 40px 32px;

        @media screen and (width <= 1919px) {
          margin: 0 30px 25px;
        }

        @media screen and (width <= 1439px) {
          margin: 0 45px 22px;
        }
      }

      .q-item {
        padding: 0;
        min-height: 0;
      }
    }
  }

  .side-menu-list {
    :deep(.menu-item) {
      .q-expansion-item {
        margin-left: 0;
        box-shadow: none;
        .q-expansion-item__container {
          & > .q-item {
            height: 40px;
            min-height: 40px;
            padding: 0 $space-1;
          }
          .q-expansion-item__content {
            padding-left: 0;
            padding-right: 0;
            .expansion-body {
              & > .q-separator {
                display: none;
              }
              & > .q-list {
                .q-item {
                  margin-left: $space-1;
                }
              }
            }
          }
        }
      }
    }

    & > .q-item {
      :deep(.q-btn) {
        padding: 0;
        .q-btn__content {
          padding-left: $space-1;
          padding-right: $space-1;
          display: flex;
        }
      }
    }
  }

  .log-out {
    align-self: end;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    height: 40px !important;

    //width: 232px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    padding: 0 14px 0 10px;
    margin: 0 0 36px 27px;

    @media screen and (width <= 1439px) {
      margin: 0 31px 33px;
    }

    @media screen and (width <= 599px) {
      margin: 0 30px 30px;

      //padding: 0 0 0 10px;
    }

    &:hover {
      background-color: rgb(255 255 255 / 10%);
    }

    .q-avatar {
      height: 22px;
      width: 22px;
      margin-right: 12px;
      transform: matrix(-1, 0, 0, 1, 0, 0);
    }
  }
}
</style>
