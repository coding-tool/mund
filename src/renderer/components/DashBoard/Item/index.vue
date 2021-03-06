<template>
  <div class="item" :class="{ 'is-expand': isExpand }">
    <Row class="basic" type="flex" align="middle">
      <Col span="2">
        <Tooltip :content="params.types[0].type" placement="right">
          <div class="type" :style="{ backgroundColor: params.types[0].color }">
            {{ params.types[0].type.charAt(0).toUpperCase() }}
          </div>
        </Tooltip>
      </Col>
      <Col span="5">
        <h5 style="font-size: 14px;">{{ params.package.name }}</h5>
        <span v-if="isExpand" style="font-size: 12px; color: #9b9b9b">Last Modified: {{ params.stat.mtime | timeAgo }}</span>
      </Col>
      <Col span="5">
        <div v-if="!isExpand && params.package.keywords && params.package.keywords.length">
          <Tag closable :color="tagColor(tag)" :name="tag" v-for="tag in params.package.keywords.slice(0, 2)" @on-close="handleDeleteTag">{{ tag }}</Tag>
          <Tooltip placement="right-start" v-if="params.package.keywords.length > 2">
            <Tag type="border">+{{ params.package.keywords.length - 2 }}</Tag>
            <div slot="content" style="white-space: pre-wrap; width: 200px;">
              <Tag closable :color="tagColor(tag)" :name="tag" v-for="tag in params.package.keywords.slice(2)" @on-close="handleDeleteTag">{{ tag }}</Tag>
            </div>
          </Tooltip>
        </div>
      </Col>
      <Col span="4">
        <span v-if="!isExpand">{{ params.stat.mtime | timeAgo }}</span>
      </Col>
      <Col span="7">
        <div v-if="!isExpand">
          <Button class="cmd-button" :type="typeColor(script)" size="small" v-for="script in Object.keys(params.package.scripts).slice(0, 3)">{{ script }}</Button>
        </div>
      </Col>
      <Col span="1">
        <Button size="small" type="ghost" shape="circle" :icon="isExpand ? 'chevron-up' : 'chevron-down'" @click="$emit('expand', !isExpand)"></Button>
      </Col>
    </Row>
    <div class="detail" v-if="isExpand">
      <div class="line"></div>
      <Row type="flex" justify="center">
        <Col span="20" class="project-content">
          <div class="left">
            <div class="desc">
              <div v-if="!isEditDesc">
                <span>
                  {{ params.package.description }}
                </span>
                <Icon type="edit" style="margin-left: 4px; cursor: pointer;" @click="handleActiveDesc"></Icon>
              </div>
              <div v-else>
                <Input ref="description" type="textarea" :rows="4" v-model="description" size="small" placeholder="Input description..." @on-keypress="handleEditDesc"></Input>
              </div>
            </div>
            <div class="version">
              <Icon class="icon" color="#2d8cf0" size="18" type="ios-information"></Icon>
              <Dropdown trigger="click" @on-click="handleVersion">
                <span style="cursor: pointer; user-select: none;">
                  {{ params.package.version }}
                  <Icon type="chevron-down"></Icon>
                </span>
                <DropdownMenu slot="list" v-if="/^\d+.\d+.\d+$/.test(params.package.version)">
                  <DropdownItem :name="version" v-for="version in generateVersion(params.package.version)">
                    {{ version }}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
            <div class="git">
              <Icon class="icon" size="18" type="social-github"></Icon>
              <a href="javascript:void(0)" @click="openUrl(params.git.url)">{{ params.git.url }}</a>
              <Icon class="icon" size="18" type="network"></Icon>
              <span>{{ params.git.branch }}</span>
            </div>
            <div class="license">
              <Icon class="icon" color="#ff9900" size="18" type="locked"></Icon>
              <span>{{ params.package.license }}</span>
            </div>
          </div>
          <div class="line">
          </div>
          <div class="right">
            <div class="tag">
              <h5>Keywords</h5>
              <span v-if="params.package.keywords && params.package.keywords.length">
                <Tag class="tag-item" closable :color="tagColor(tag)" :name="tag" v-for="tag in params.package.keywords" @on-close="handleDeleteTag">{{ tag }}</Tag>
              </span>

              <AutoComplete
                class="tag-item"
                v-model="newTag"
                :data="this.$store.state.Project.tags"
                :filter-method="filterMethod"
                placeholder="input or search tag..."
                size="small"
                icon="plus"
                @keyup.enter.native="handleAddTag(newTag)"
                @on-select="handleAddTag"
                style="width: 160px"
                @scroll.native="handleScroll">
              </AutoComplete>
            </div>
            <div class="script">
              <h5>NPM Script</h5>
              <div class="list">
                <Tooltip placement="top-end" v-for="(cmd, key) in params.package.scripts">
                  <Button class="script-item">{{ key }}</Button>
                  <div slot="content">
                    <div class="script-cmd" style="width: 200px; white-space: pre-wrap;">{{ cmd }}</div>
                  </div>
                </Tooltip>
                <Button class="script-item" icon="ios-plus-empty" type="dashed" @click="isEditScript = !isEditScript">
                  Add
                </Button>
                <Modal
                  title="Add a script"
                  v-model="isEditScript"
                  :closable="false"
                  @on-ok="handleAddScript">
                  <Form :model="script" :label-width="80">
                    <FormItem label="Name">
                      <Input v-model="script.name" placeholder="Enter name..."></Input>
                    </FormItem>
                    <FormItem label="Command">
                      <Input v-model="script.command" type="textarea" :autosize="{minRows: 2,maxRows: 5}" placeholder="Enter command..."></Input>
                    </FormItem>
                  </Form>
                </Modal>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <Button type="error" long size="small" @click="handleDelete">DELETE</Button>
    </div>
  </div>
</template>

<script>
import wordToRGB from '@/utils/wordToRGB'
const { shell } = require('electron')

export default {
  name: 'item',
  props: {
    params: Object,
    isExpand: Boolean
  },
  data () {
    return {
      isEditDesc: false,
      isEditScript: false,
      description: '',
      newTag: '',
      tagOptions: [],
      script: {
        name: '',
        command: ''
      }
    }
  },
  methods: {
    openUrl (url) {
      shell.openExternal(url)
    },
    // determine the button type with the string
    typeColor (str) {
      if (['dev'].find(type => str.toLowerCase().indexOf(type) !== -1)) {
        return 'primary'
      } else if (['build', 'lint', 'unit'].find(type => str.toLowerCase().indexOf(type) !== -1)) {
        return 'success'
      } else if (['test', 'demo'].find(type => str.toLowerCase().indexOf(type) !== -1)) {
        return 'warning'
      } else {
        return 'info'
      }
    },

    // determine the tag color with the string
    tagColor (str) {
      return wordToRGB(str)
    },

    generateVersion (version) {
      if (/^\d+.\d+.\d+$/.test(version)) {
        return [
          version.replace(/(^\d+).(\d+).(\d+$)/g, ($1, $2, $3, $4) => [$2, $3, parseInt($4, 10) + 1].join('.')),
          version.replace(/(^\d+).(\d+).(\d+$)/g, ($1, $2, $3, $4) => [$2, parseInt($3, 10) + 1, 0].join('.')),
          version.replace(/(^\d+).(\d+).(\d+$)/g, ($1, $2, $3, $4) => [parseInt($2, 10) + 1, 0, 0].join('.'))
        ]
      } else {
        return []
      }
    },

    // delete this project
    handleDelete () {
      this.$Modal.confirm({
        title: `Delete Project`,
        content: `Will delete the project - <b style="color: #19be6b">${this.params.package.name}</b>, confirm?`,
        onOk: () => {
          this.$emit('delete')
        },
        onCancel: () => {
          this.$Message.info('Cancle the delete operation.')
        }
      })
    },

    handleActiveDesc () {
      this.isEditDesc = true
      this.description = this.params.package.description

      // wait for ref description rendered
      this.$nextTick(() => {
        if (this.$refs['description']) {
          this.$refs['description'].focus()
        }
      })
    },

    handleEditDesc (event) {
      event = event || window.event

      if (event.keyCode === 13) {
        // prevent origin event to go to next line
        event.preventDefault()
        event.returnValue = false

        this.editDesc()
      }
    },

    // edit description
    editDesc () {
      if (this.description.trim()) {
        this.$Modal.confirm({
          title: `update description of <b style="color: #2d8cf0">${this.params.package.name}</b>`,
          content: `<b style="color: #19be6b">"${this.description}"</b>, confirm?`,
          onOk: () => {
            let content = JSON.parse(JSON.stringify(this.params.package))
            content.description = this.description

            this.$emit('update', {
              name: this.params.path,
              file: 'package.json',
              content
            })

            this.isEditDesc = false
          },
          onCancel: () => {
            this.$Message.info('Cancle the update operation.')
            this.isEditDesc = false
          }
        })
      } else {
        this.$Message.warning('The description is not valid.')
      }
    },

    handleVersion (ver) {
      this.$Modal.confirm({
        title: `update version of <b style="color: #2d8cf0">${this.params.package.name}</b>`,
        content: `<b style="color: #19be6b">"${ver}"</b>, confirm?`,
        onOk: () => {
          let content = JSON.parse(JSON.stringify(this.params.package))
          content.version = ver

          this.$emit('update', {
            name: this.params.path,
            file: 'package.json',
            content
          })
        },
        onCancel: () => {
          this.$Message.info('Cancle the update operation.')
        }
      })
    },

    // add tag of the project
    handleAddTag (value) {
      if (value) {
        if (this.params.package.keywords && this.params.package.keywords.length) {
          if (this.params.package.keywords.find(t => t === value)) {
            this.$Message.warning('This tag already exists.')
          } else {
            this.$Modal.confirm({
              title: `add keyword for <b style="color: #2d8cf0">${this.params.package.name}</b>`,
              content: `<b style="color: #19be6b">"${value}"</b>, confirm?`,
              onOk: () => {
                let content = JSON.parse(JSON.stringify(this.params.package))
                content.keywords = this.params.package.keywords.concat(value)

                this.$emit('update', {
                  name: this.params.path,
                  file: 'package.json',
                  content
                })
              },
              onCancel: () => {
                this.$Message.info('Cancle the add tag operation.')
              }
            })
          }
        } else {
          this.$Modal.confirm({
            title: `add keyword for <b style="color: #2d8cf0">${this.params.package.name}</b>`,
            content: `<b style="color: #19be6b">"${value}"</b>, confirm?`,
            onOk: () => {
              let content = JSON.parse(JSON.stringify(this.params.package))
              content.keywords = [ value ]

              this.$emit('update', {
                name: this.params.path,
                file: 'package.json',
                content
              })
            },
            onCancel: () => {
              this.$Message.info('Cancle the add tag operation.')
            }
          })
        }
      }
    },

    // delete ont tag
    handleDeleteTag (event, tag) {
      if (tag) {
        if (this.params.package.keywords && this.params.package.keywords.length) {
          let index = this.params.package.keywords.findIndex(t => t === tag)

          if (index !== -1) {
            this.$Modal.confirm({
              title: `delete keyword of <b style="color: #2d8cf0">${this.params.package.name}</b>`,
              content: `<b style="color: #19be6b">"${tag}"</b>, confirm?`,
              onOk: () => {
                let content = JSON.parse(JSON.stringify(this.params.package))
                content.keywords.splice(index, 1)

                this.$emit('update', {
                  name: this.params.path,
                  file: 'package.json',
                  content
                })
              },
              onCancel: () => {
                this.$Message.info('Cancle the delete tag operation.')
              }
            })
          } else {
            this.$Message.warning('This tag not exists.')
          }
        }
      }
    },

    // auto filter in the exist tags
    filterMethod (value, option) {
      if (value !== undefined && option && typeof option === 'string') {
        return option.toUpperCase().indexOf(value.toUpperCase()) !== -1
      } else {
        return false
      }
    },

    handleAddScript () {
      let content = JSON.parse(JSON.stringify(this.params.package))

      if (content.scripts) {
        if (Object.keys(content.scripts).includes(this.script.name)) {
          this.$Message.warning('The script name exists.')
          return
        } else {
          if (!this.script.command) {
            this.$Message.warning('The script command illegal.')
            return
          } else {
            content.scripts[this.script.name] = this.script.command
          }
        }
      } else {
        content.scripts = {}
        content.scripts[this.script.name] = this.script.command
      }

      this.$emit('update', {
        name: this.params.path,
        file: 'package.json',
        content
      })

      this.script = {
        name: '',
        command: ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .item {
    width: 100%;
    padding: 0 10px;
    border-radius: 6px;
    .basic {
      height: 50px;
      font-size: 14px;
      .type {
        width: 30px;
        height: 30px;
        line-height: 30px;
        border-radius: 50%;
        color: #fff;
        background: #7ED321;
        text-align: center;
      }
      .cmd-button {
        &:not(:first-child) {
          margin-left: 4px;
        }
      }
    }
    .detail {
      padding-bottom: 10px;
      .line {
        height: 1px;
        background: linear-gradient(to right, transparent, #9b9b9b, transparent)
      }
      .project-content {
        display: flex;
        justify-content: space-between;
        .left, .right {
          flex: 0 0 48%;
          padding: 10px 0;
        }
        .left {
          .version, .git, .license {
            margin-top: 4px;
            height: 24px;
            display: flex;
            align-items: center;
            .icon {
              margin-right: 10px;
              &:not(:first-child) {
                margin-left: 20px;
              }
            }
          }
        }
        .right {
          .tag, .script {
            h5 {
              margin-bottom: 4px;
              font-size: 14px;
            }
          }
          .tag {
            .tag-item {
              margin: 4px;
            }
          }
          .script {
            margin-top: 10px;
            .list {
              display: flex;
              flex-wrap: wrap;
              .script-item {
                margin: 4px;
                padding: 0 4px;
                width: 120px;
                height: 40px;
                background: #3b3b56;
                border-radius: 4px;
                &:hover {
                  background: #3f3f63;
                }
              }
            }
          }
        }
        .line {
          flex: 0 0 1px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, #9b9b9b, transparent)
        }
      }
    }
  }
  .is-expand {
    margin: 10px 0;
    background: #1B1B30 !important;
  }
</style>
