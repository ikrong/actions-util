# readme

个人使用的 Github actions 工具

# 支持

## fetch url

```yaml
- uses: ikrong/actions-util@v1.0.0
  with:
      function: fetch
      params: '["https://api.github.com/repos/apache/echarts/releases/latest","get",["tag_name","author.login"]]'
- run: |
       echo ${{env.tag_name}}
       echo ${{env.author_login}}
```