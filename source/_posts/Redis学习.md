---
title: Redis学习
date: 2025-10-31 21:07:33
tags:
- JAVA
- Redis
---

# Redis基础

## Redis简介

### 问题现象

- 海量用户
- 高并发

### 罪魁祸首——关系型数据库——关系型数据库

- 性能瓶颈：磁盘IO性能低下
- 扩展瓶颈：数据关系复杂，扩展性差，不便于大规模集群

### 解决思路

- 降低磁盘IO次数，越低越好        ——内存存储-------------------------------->Nosql
- 去除数据间关系，越简单越好    ——不存储关系，仅存储数据---------->Nosql<!--more-->

### Nosql

即Not-Only-SQL(泛指非关系型的数据库)，<span style = "color:red">作为关系型数据库的补充</span>

作用：应对基于<span style = "color:red">海量用户和海量数据</span>前提下的数据处理问题

特征：

- 可扩容、可伸缩
- 大数据量下高性能 
- 灵活的数据模型
- 高可用

常用的Nosql数据库：

![](Redis学习/Redis解决方案.png)

- Redis
- memcache
- HBase
- MongoDB

### Redis

概念：Redis(REmote DIctionary Server)是<span style = "color:red">高性能</span>键值对(<span style = "color:red">key-value</span>)数据库。

特征：

1、数据间没有必然的关联关系

2、内部采用<span style = "color:red">单线程</span>机制进行工作

3、高性能，官方提供测试数据，50个并发执行100000个请求，读的速度是110000次/s，写的速度是81000次/s。

4、多数据类型支持

- 字符串类型——String：最简单最常用的
- 哈希(散列)类型——hash：也叫散列,类似于Java中的HashMap结构（field：value），<span style ="color:red">适合用于存储对象</span>
- 列表类型——list：队列，按照插入顺序排序，可以**有重复元素**，类似于Java中的LinkedList
- 集合类型——set：无序集合，**没有重复元素**，类似于Java中的HashSet
- 有序集合类型——sorted set/zset：集合中每个元素关联一个分数(score)，根据分数升序排序，没有重复元素

5、持久化支持，可以进行<span style = "color:red">数据灾难恢复</span>，防止断电的情况。

### Redis的应用

- 为<span style = "color:red">热点数据加速查询</span>（主要场景），如热点商品、热点新闻、热点资讯、推广类等<span style = "color :red">高访问量信息</span>等
- 任务队列，如秒杀、抢购、购票排队等
- 即时信息查询，如各位排行榜、各类网站访问统计、公交到站信息、在线人数信息(聊天室、网站)、设备信号等
- 时效性信息控制，如验证码控制、投票控制等
- <span style = "color:red">分布式数据共享</span>，如分布式集群架构中的session分离
- 消息队列
- 分布式锁

### Redis的基本操作

命令行模式工具使用思考

- 功能性命令
- 清除屏幕信息
- 帮助信息查阅
- 退出指令

信息添加

- 功能：设置key，value数据
- 命令：SET key value
- 范例：set name itheima

信息查询

- 功能：根据key查询对应的value，如果不存在，返回空(nil)
- 命令：GET key
- 范例：get name

清楚屏幕信息

- 功能：清除屏幕中的信息
- 命令：clear

帮助

- 功能：获取命令帮助文档，获取组中所有命令信息名称
- 命令：help 命令名称                      help @组名

退出客户端命令行模型

- 功能：退出客户端
- 命令：quit  exit  \<ESC>

## Redis数据类型

### 业务数据的特殊性

#### 作为缓存使用

1、原始业务功能设计

- 秒杀
- 618活动
- 双11活动

2、运营平台监控到的突发高频访问数据

- 突发时政要闻，被强势关注围观

3、高频、复杂的统计数据

- 在线人数
- 投票排行榜

#### 附加功能

系统功能优化或升级

- 单服务器升级集群
- Session管理
- Token管理

### 字符串String操作命令

String类型

- 存储的数据：单个数据，最简单的数据存储类型，也是最常用的数据存储类型
- 存储数据的格式：一个存储空间保存一个数据
- 存储内容：通常使用字符串，如果字符串以<span style = "color:red">整数</span>的形式展示，<span style = "color:red">可以作为数字操作使用</span>

string类型数据的基本操作

- SET key value：设置指定key的 值
- GET key：获取指定key的值
- DEL key：删除指定key的值
- SETNX key value：只有在key不存在时设置key的值，不存在key的时候返回0并创建key-value，反之为1并不创建key-value，应用场景：分布式锁
- MSET key1 value1 key2 value2：修改/添加多个数据
- MGET key1 key2...：获取多个数据
- STRLEN key：获取数据字符个数(字符串长度)
- APPEND key value：追加信息到原始信息后部（如果原始信息存在就追加，否则新建）

#### 单数据操作与多数据操作的选择之惑

单指令(set)3条指令的执行过程：发送指令时间x6+执行指令x2

多指令(mset)3条指令的执行过程：发送指令时间x2+执行指令x2

#### String类型数据的扩展操作

##### 解决方案

- 设置数值数据增加指定范围的值
  - incr key：一次增加一个单位的值
  - incrby key increment：设置增长的值进行增加（不能增加小数）
  - incrbyfloat key increment：设置增加的浮点型值
- 设置数值数据减少指定范围的值
  - de cr key：一次减少一个单位的值
  - decrby key increment

- string作为数值操作
  - string再redis内存存储默认就是一个<span style = "color:red">字符串</span>，当遇到增减类操作incr，decr时会转成数值型进行计算。
  - redis所有的操作都是原子性的，<span style = "color:red">采用单线程处理</span>所有业务，命令是一个一个执行的，因此无需考虑并发带来的数据影响。
  - 注意：按数值进行操作的数据，如果原始数据不能转换成数值，或超越了redis数值上限范围将报错。

- 设置数据具有指定的生命周期
  - SETEX key seconds value：设置指定key的值，并将key的过期时间设为sconds秒，到时间后自动被redis清理，常见于短信验证码等短时间有效的数据
  - PSETEX key milliseconds value：设置时间为毫秒
  - 通过数据是否失效控制业务行为，适用于所有具有时效性限定控制的操作。

##### 注意事项

- 数据操作不成功的反馈与数据正常操作之间的差异
  - 表示运行结果是否成功
    - (integer)0 ->false 失败
    - (integer)1 ->true 成功
  - 表示运行结果值
    - (integer)3 ->3    3个
    - (integer)1 ->1    1个
  - 数据最大存储量
    - 512MB
  - 数值最大范围(java中long的最大值)
    - 9223372036854775807

##### key的设置约定

- 数据库中的热点数据key命名惯例
 ![](Redis学习/key的设置约定.png)

### Hash哈希操作命令

#### 存储的困惑

对象类数据的存储如果具有较繁琐的更新需求操作会显得笨重![](Redis学习/hash.png)

hash类型

- 新的存储需求：对一系列存储的数据进行编组，方便管理，典型应用存储对象信息
- 需要的存储结构：一个存储空间保存多个键值对数据
- hash类型：底层使用<span style = "color:red">哈希表</span>结构实现数据存储

![](Redis学习/hash存储空间.png)

hash存储结构优化

- 如果field数量<span style = "color:red">较少</span>，存储结构优化为<span style = "color:red">类数组结构</span>
- 如果field数量<span style = "color:red">较多</span>，存储结构使用<span style = "color:red">HashMap结构</span>

基本操作

- HSET key field value：设置哈希表中key中的field的value，类似于表名-属性-值
- HGET key field：获取指定字段的值
- HGETALL key：获取所有字段的值
- HDEL key field：删除指定的field字段
- HMSET key field1 value1 field2 value2：添加/修改多个数据
- HMGET key field1 field2...：获取多个数据
- HLEN key：获取哈希表(field)中字段的数量
- HEXISTS key field：获取哈希表中是否存在指定的字段
- HKEYS key：获取哈希表中所有的<span style = "color:red">字段名</span>
- HVALS key：获取哈希表中所有的<span style = "color:red">字段值</span>
- HINCRBY key field increment：设置指定字段的数值数据增加指定范围的值
- HINCRBYFLOAT key field increment：设置指定字段的数值数据增加指定范围的<span style = "color:red">浮点值</span>
- HSETNX key field value：判断是否存在这个field没有就添加值，反之不添加

hash类型数据操作的注意事项

- hash类型下的value<span style = "color:red">只能存储字符串，不允许存储其他数据类型</span>，**不存在嵌套现象**。如果数据未获取到，对应的值为(nil)
- 每个hash可以<span style = "color:red">存储2<sup>32</sup>-1个键值对</span>
- hash类型十分贴近对象的数据存储形式，并且可以灵活添加删除对象属性。但hash设计初衷<span style = "color:red">不是为了存储大量对象</span>而设计的，不可滥用，更不可将hash作为对象列表使用
- hgetall操作获取全部属性，<span style = "color:red">如果内部field过多，遍历整体数据效率就会很低</span>，有可能成为数据访问瓶颈

应用场景

- 电商网站购物车设计与实现
  - 比如购物车数据，用户id作为key，商品id作为field，数量作为value
  - 业务分析
    - 仅分析购物车的redis存储模型
      - 添加、浏览、更改数量、删除、清空
    - 购物车于数据库间持久化同步
    - 购物车于订单间的关系
      - 提交购物车：读取数据生成订单
      - 商家临时价格调整：隶属于订单级别
      - 商家临时价格调整：隶属于订单级别
    - 未登录用户购物车信息存储
      - cookie存储

业务场景

- 双11活动日，销售手机充值卡的商家对移动、联通、电信的30元、50元、100元商品推出抢购活动，每种商品抢购上限1000张

![](Redis学习/hash业务场景.png)

string存储对象(json)与hash存储对象

- string存讲究整体性（读为主），hash更适合更新的概念

### list类型

数据存储需求：存储多个数据，并对数据进入存储空间的顺序进行区分

需要的存储结构：一个存储空间保存多个数据，且通过数据可以体现进入顺序

list类型：保存多个数据，底层使用<span style = "color :red">双向链表</span>存储结构实现

#### list类型数据基本操作

- LPUSH key value[value2]：头插法插入数据（左边插入），先进先出
- RPUSH key value[value2]：尾插法插入数据（右边插入）
- LRANGE key start stop：查询数据从start下标到stop下标
- LINDEX key index：获取对应下标数据
- LLEN key：获取列表长度
- RPOP key：移除并获取列表最后一个元素，也可以LPOP从左边删除
- LPOP key：移除并获取列表第一个元素
- LREM key count value：移除指定数据,count指的是删除几个

#### list类型数据扩展操作

- blpop key1 [key2] timeout：我认为是监听key，在timeout时间内如果有数据立刻拿出来一个，如果内部没有数据就在timeout时间内一旦插入立刻拿出来，brpop同理
- brpop key1 [key2] timeout

- 业务场景
  - 微信朋友圈点赞，要求按照点赞顺序显示点赞好友信息

#### list类型数据操作注意事项

- list中保存的数据都是string类型的，数据总容量是有限的，最多2<sup>32</sup>-1个元素(4294967295)
- list具有索引的概念，但是操作数据时通常以<span style = "color:red">队列</span>的形式进行入队出队操作，或以栈的形式进行入栈出栈操作
- 获取全部数据操作结束索引设置为-1
- list可以对数据进行分页操作，通常第一页的信息来自于list，第2页及更多的信息通过数据库的形式加载
- 业务场景
  - twitter、新浪微博、腾讯微博中个人用户的关注列表需要按照用户的关注顺序进行展示，粉丝列表<span style = "color:red">需要将最近关注的粉丝列在前面</span>。
  - 企业运营工程中，系统将产生大量的运营数据，如何保障多台服务器操作日志的统一顺序输出![](Redis学习/redis-list.png)
- 解决方案
  - 依赖list的数据具有顺序的特征对信息进行管理
  - 使用队列模型解决多路信息汇总合并的问题
  - 使用栈模型解决最新消息的问题
  - 应用于最新消息得展示

### Set类型

简介

- 新的存储需求：存储大量的数据，在查询方面提供更高的效率
- 需要的存储结构：能够保存大量的数据，搞笑的内部存储机制，便于查询![](Redis学习/set存储空间.png)
- set类型：与hash存储结构完全相同，仅存储键，不存储值(nil)，并且<span style = "color:red">值是不允许重复的</span>

#### set类型数据的基本操作

是String类型的<span style="color:red">无序集合</span>。集合成员是<span style = "color : red">唯一的，集合中不能出现重复的数据</span>

- SADD key member1[member2]:向集合添加一个或多个成员
- SMEMBERS key：返回集合中的所有成员
- SCARD key：获取集合的成员数
- SINTER key1[key2]：返回给定所有集合的<span style="color:red">交集</span>
- SUNION key1[key2]：返回所有给定集合的<span style="color:red">并集</span>
- SREM key member1[member2]：删除集合中的元素
- SISMEMBER key member：获取集合中是否包括指定数据

#### set类型数据的扩展操作

##### 业务场景1

每位用户首次使用今日头条时会设置3项爱好的内容，但是后期为了增加用户的活跃度、兴趣点，必须让用户对其他信息类别逐渐产生兴趣，增加客户留存度

###### 业务分析

- 系统分析出各个分类的最新或最热点信息条目并组织成set集合
- 随机挑选其中部分信息
- 配合用户关注信息分类中的热点信息组织成展示的全信息集合

###### 解决方案

- SRANDMEMBER key [count]：<span style = "color:red">随机</span>获取集合中指定数量的数据
- SPOP key：<span style = "color:red">随机</span>获取集合中的某个数据并将该数据移出集合![](Redis学习/srandmemberAndspop.png)

- tips：redis应用于随机推荐类信息检索，例如热点歌单推荐，热点新闻推荐，热卖旅游线路，应用APP推荐，大V推荐等

##### 业务场景2

脉脉为了促进用户间的交流，保障业务成单率的提升，需要让每位用户拥有大量的好友，事实上职场新人不具有更多的职场好友，如何快速为用户积累更多的好友——这就好比微信和QQ有时候会推荐好友，你们有多少个共同好友

###### 解决方案

- 求2个集合的交、并、差集
  - SINTER key1 [key2]
  - SUNION key1 [key2]
  - SDIFF key1 [key2]
- 求2个集合的交、并、差集并存储到指定集合中![](Redis学习/交并差.png)
  - SINTERSTORE destination key1 [key2]
  - SUNIONSTORE destination key1 [key2]
  - SDIFFSTORE destination key1 [key2]
- 将指定数据从原始集合中移动到目标集合中
  - SMOVE source destination member
- tips
  - redis应用于同类信息的关联搜索，二度关联搜索，深度关联搜索
  - 显示共同关注(一度)
  - 显示共同好友(一度)
  - 由用户A出发，获取到好友用户B的好友信息列表(一度)
  - 由用户A出发，获取到好友用户B的购物清单列表(二度)
  - 由用户A出发，获取到好友用户B的游戏充值列表(二度)

set类型数据操作的注意事项

- set类型不允许数据重复，如果添加的数据在set中已经存在，将只保留一份
- set虽然与hash的存储结构相同，但是无法启动hash中存储值的空间

##### 业务场景3

集团公司共具有12000名员工，内部OA系统中具有700多个角色，3000多个业务操作，23000多种数据，每位员工具有一个或多个角色，如何快速进行业务操作的权限校验。![](Redis学习/set应用场景.png)

###### 解决方案

- 依赖set集合数据不重复的特征，依赖set集合hash存储结构特征完成数据过滤与快速查询
- 根据用户id获取用户所有角色
- 根据用户所有角色<span style = "color:red">获取用户所有操作权限放入set集合</span>
- 根据用户所有角色<span style = "color:red">获取用户所有数据全选放入set集合</span>
- tips
  - redis应用于同类型不重复数据的合并操作

##### 业务场景4

公司对旗下新的网站做推广，统计网站的PV（访问量）,UV(独立访客)，IP（独立IP）。

PV：<span style = "color:red">网站被访问次数</span>，可通过刷新页面提高访问量

UV：<span style = "color:red">网站被不同用户访问的次数</span>，可<span style = "color:red">通过cookie统计</span>访问量，**相同用户切换IP地址**，UV不变

IP：<span style = "color:red">网站被不同IP地址访问的总次数</span>，可通过IP地址统计访问量，相同IP不同用户访问，IP不变

###### 解放方案

- 利用set集合的数据去重特征，记录各种访问数据
- 建立string模型，利用incr统计日访问量（PV）
- 建立set模型，记录不同cookie数量（UV）
- 建立set模型，记录不同IP数量（IP）
- tips
  - redis应用于同类型数据的快速去重

##### 业务场景5

黑名单与白名单问题，在资讯类信息类网站追求高访问量，但是由于其信息的价值，会通过爬虫技术快速获取信息，个别特种行业网站信息通过爬虫获取分析后，转化为商业机密销售，例如：第三方火车票、机票、电商刷评论等。同时爬虫带来的伪流量会给经营者带来错觉，因此基于技术层面区分出爬虫用户后，需要将此类用户屏蔽。而对于安全性更高的应用访问，就可以设置白名单，依赖白名单做更为严苛的访问验证。

###### 解决方案

- 基于经营战略设定问题用户发现、鉴别规则
- 周期性更新满足规则的用户黑名单，加入set集合
- 用户行为信息达到后与黑名单进行比对，确认行为去向
- 黑名单过滤ip地址：应用于开放游客访问权限的信息源
- 黑名单过滤设备信息：应用于限定访问设备的信息源
- 黑名单过滤用户：应用基于访问权限的信息源
- tips
  - redis应用于基于黑名单与白名单设定的服务控制

### sorted_set类型

新的存储需求：数据排序有利于数据的有效展示，需要提供一种可以<span style = "color:red">根据自身特征进行排序的方式</span>

需要的存储结构：可以保存可排序的数据

sorted_set类型：在set的存储结构基础上添加可排序字段

![](Redis学习/sorted_set.jpg)

#### sorted_set类型数据的基本操作

添加数据

- ZADD key score1 member1 [score2 member2]

获取全部数据

![](Redis学习/获取全部数据.png)

- ZRANGE key start stop [WITHSCORES]
- ZREVRANGE key start stop [WITHSCORES]

删除数据

- ZREM key member [member]

按条件获取数据

- ZRANGEBYSCORE key min max [WITHSCORES] [LIMIMT]
- ZREVRANGEBYSCORE key max min [WITHSCORES]

条件删除数据

- ZREMRANGEBYRANK key start stop
- ZREMRANGEBYSCORE key min max

注意

- min和max用于限定搜索查询的条件
- start和stop用于限定查询范围，作用于索引，表示开始和结束索引
- offset与count用于限定查询范围，作用于查询结果，表示开始位置和数据总量

获取集合数据总量

- zcard key
- zcount key min max

集合交、并操作

- zinterstore destination numkeys key [key...]
- zunionstore destination numkeys key [key...]

#### 业务场景1

- 票选广东十大杰出青年，各类综艺选秀海选投票

- 各类资源网站TOP10（电影，歌曲，文档，电商，游戏等）

- 聊天室活跃度统计

- 游戏好友亲密度

##### 业务分析

- 为所有参与排名的资源建立排序依据

##### 解决方案

- 获取数据对应的索引（排名）![](Redis学习/sorted_set.png)
  - ZRANK key member
  - ZREVRANK key member
- score值获取与修改
  - ZSCORE key member
  - ZINCRBY key increment member

#### sorted_set类型数据操作的注意事项

- score保存的<span style = "color:red">数据存储空间是64位</span>，如果是整数范围是-9007199254740992~~~~9007199254740992
- score保存的数据也可以是一个<span style = "color:red">双精度的double值</span>，基于双精度浮点数的特征，<span style = "color:red">可能会丢失精度</span>，使用时候要谨慎
- sorted_set底层存储还是基于set结构的，因此数据不重复，如果重复添加相同的数据，score值将被反复覆盖，<span style = "color:red">保留最后一次修改的结果</span>

#### 业务场景2

基础服务+增值服务类网站会设定各位会员的试用，让用户充分体验会员优势。例如观影试用VIP、游戏VIP体验、云盘下载体验VIP、数据查看体验VIP。当VIP体验到期后，如果有效管理此类消息。即便对于正式VIP用户也存在对应的管理方式。

网站会定期开启投票、讨论，限时进行，逾期作废。如何有效管理此类过期信息。

##### 解决方案

- 对于<span style = "color:red">基于时间线限定的任务处理</span>，将处理时间记录为score值，<span style = "color:red">利用排序功能区分处理的先后顺序</span>
- 记录下一个要处理的时间，当到期后处理对应任务，移除redis中的记录，并记录下一个要处理的时间
- 当新任务加入时，判定并更新当前下一个要处理的任务时间
- 为提升sorted_set的性能，通常将任务根据特征存储成若干个sorted_set。例如1小时内，1天内，周内，月内，季内，年度等，操作时逐级提升，将即将操作的若干个任务纳入到1小时内处理的队列中。

- 获取当前系统时间
  - time![](Redis学习/time.png)

- tips:
  - redis应用于定时任务执行顺序管理或任务过期管理

#### 业务场景3

任务/消息权重设定应用

- 当任务或者消息待处理，形成了任务队列或消息队列时，对于高优先级的任务要保障对其优先处理，如何实现任务权重管理

##### 解决方案

- 对于带有权重的任务，优先处理权重高的任务，<span style = "color:red">采用score记录</span>权重即可

​        多条件任务权重设定

​                如果权重条件过多时，需要对排序score值进行处理，保障score值能够兼容2条件或者多条件，例如外贸订单优先于国内订单，总裁订单优先于员工订单，经理订单优先于员工订单

- 因score长度受限，需要对数据进行截断处理，尤其是时间设置为小时或分钟级即可(折算后)
- 先设定订单类别，后设定订单发起角色类别，整体score长度必须是统一的，不足位补0，第一排序规则首位不得是0
  - 例如外贸101，国内102，经理004，员工008
  - 员工下的外贸单score值为101008（优先）
  - 经理下的国内单score值为102004
- tips：
  - redis应用于即时任务/消息队列执行管理

### 数据类型实践案例

#### 业务场景1

人工只能领域的语义识别与自动对话将是未来服务业机器人应答呼叫体系中的重要技术，百度自研用户评价语义识别服务，免费开放给企业试用，同时训练百度自己的模型。现对试用用户的使用行为将进行限速，限速每个用户每分钟最多发起10次调用

##### 解决方案

- 设计计时器，<span style = "color:red">记录调用次数</span>，用于控制业务执行次数。以用户id作为key，试用次数作为value
- 在调用前获取次数，判断是否超过限定次数
  - 不超过次数的情况下，每次调用技术+1
  - 业务调用失败，计数-1
- 为计时器设置生命周期为指定周期。例如1秒/分钟，自动清空周期内使用次数

###### 解决方案改良

- 取消最大值的判定，利用incr操作超过最大值抛出异常的形式替代每次判断是否大于最大值
- 判断是否为nil
  - 如果是，设置为Max-次数
  - 如果不是，计数+1
  - 业务调用失败，计数-1
- 遇到异常即+操作超过上限，视为使用达到上限![](Redis学习/思路.png)![](Redis学习/max_err.png)

#### 业务场景2

使用微信的过程中，当微信接收消息后，会默认将最近接受的消息置顶，当多个好友及关注的订阅号同时发送消息时，该排序会不停的进行交替。同时还可以将重要的会话设置为置顶。一旦用户离线后，再次打开微信时，消息该按照什么样的顺序显示。

##### 解决方案

- 依赖list的数据具有顺序的特征对消息进行管理，将list结构作为栈使用
- 对置顶与普通会话分别创建独立的list分别管理
- 当某个list中接收到用户消息后，将消息发送方的id从list的一侧加入list(此处设定左侧)
- 多个相同id发出的消息反复入栈会出现问题，在入栈之前无论是否具有当前id对应的消息，先删除对应id
- 推送消息时先推送置顶会话list，再推送普通会话list，推送完成的list清除所有数据
- <span style = "color:red">消息的数量，也就是微信用户对话数量采用计数器的思想另行记录，伴随list操作同步更新</span>
- tips
  - redis应用于基于时间顺序的数据操作，而不关注具体时间

## Redis通用指令

### key通用指令

##### key特征

- key是一个字符串，通过key获取redis中保存的数据

##### key应该设计哪些操作

- 对于key自身状态的相关操作，例如：删除，判定存在，获取类型等
- 对于key有效性控制相关操作，例如：有效期设定，判定是否有效，有效状态的切换等
- 对于key快速查询操作，例如：按指定策略查询key

##### key基本操作

删除指定key

- del key

获取key是否存在

- exists key

获取key的类型

- type key

##### key扩展操作（时效性控制）

为指定key设置有效期

- expire key seconds
- pexpire key milliseconds
- expireat key timestamp
- pexpireat key milliseconds-timestamp

获取key的有效时间

- ttl key
- pttl key

切换key从时效性转换为永久性

- persist key

##### key扩展操作(查询模式)

查询key

- keys pattern

###### 查询模式规则

*：匹配任意数量的任意符号                 ？：配合一个任意符号         []：匹配一个指定符号

|keys *|查询所有|
|---------|-------------|
|keys it*|查询所有以it开头|
|keys *heima|查询所有以heima结尾|
|keys ??heima|查询所有前面2个字符任意，后面以heima结尾|
|keys user:?|查询所有以user:开头，最后一个字符任意|
|keys u[st]er:1|查询所有以u开头，以er:1结尾，中间包含一个字母，s或t|

###### key其他操作

为key改名

- rename key newkey
- renamenx key newkey：如果不存在再改名

对所有key排序

- sort

其他key通用操作

- help @generic

### 数据库通用指令

#### key的重复问题

- redis在使用过程中，伴随着操作数据量的增加，会出现大量的数据以及对应的key
- 数据不区分种类、类别混杂在一起，极易出现重复或冲突

##### 解决方案

- redis为每个服务提供有16个数据库，编号从0到15
- 每个数据库之间的数据相互独立

#### db基本操作

切换数据库

- select index

其他操作

- quit：退出
- ping：测试连通性
- echo message：相当于在redis控制输出日志

数据移动

- move key db

数据清除

- dbsize：查看当前数据库的数据总量
- flushdb：清除<span style = "color:red">当前数据库</span>的数据
- flushall：清除<span style = "color:red">所有数据库</span>中所拥有的数据

## Jedis

JAVA语言连接redis服务

- Jedis
- SpringData Redis
- Lettuce

###  客户端连接redis

分三步

- 连接redis

```java
Jedis jedis = new Jedis("127.0.0.1", 6379);
```

- 操作redis——和在控制台一样的操作

```JAVA
//jedis.set("name","itheima");
String name = jedis.get("name");
System.out.println(name);
```

- 关闭redis连接

```JAVA
jedis.close();
```

### 案例：服务调用次数控制

人工智能领域的语义识别与自动对话将是未来服务业机器人应答呼叫体系中的重要技术，百度自研用户评价语义识别服务，免费开放给企业试用，同时训练百度自己的模型。现对试用用户的使用行为进行限速，限制每个用户每分钟最多发起10次调用

- 案例要求
  - 设定A、B、C三个用户
  - A用户限制10次/分调用，B用户限制30次/分调用，C用户不限制

#### 需求分析

- 设定一个服务方法，用于<span style = "color:red">模拟实际业务调用的服务</span>，<span style = "color:blue">内部采用打印模拟调用</span>
- 在业务调用前服务调用控制单元，内部使用redis进行控制，参照之前的方案
- 对调用超限使用异常进行控制，异常处理设定为打印提示信息
- 主程序启动3个线程，分别表示3种不同用户的调用

```JAVA
package com.itheima;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.exceptions.JedisDataException;

public class Service {
    private String id;
    private Integer count;
    public Service(String id,Integer count){
        this.id = id;
        this.count = count;
    }
    //控制单元
    public void service() {
        Jedis jedis = new Jedis("127.0.0.1", 6379);
        //获取到值
        String value = jedis.get("compid" + id);
        //判断该值是否存在
        try {
            if (value == null) {
                //不存在，创建该值
                jedis.setex("compid" + id, 5, Long.MAX_VALUE - count + "");

            } else {
                //存在，自增，调用业务
                Long val = jedis.incr("compid" + id);
                business(id,count-(Long.MAX_VALUE - val));
            }
        } catch (JedisDataException e) {
            System.out.println("使用到达次数上限，请升级会员级别");
            return;
        } finally {
            jedis.close();
        }
    }

    //业务操作
    public void business(String id,Long val) {
        System.out.println("用户" + id + "业务操作执行" + val +"次");
    }
}

class MyThread extends Thread {
    Service sc;
    public MyThread(String id,Integer count){
        sc = new Service(id,count);
    }
    public void run() {
        while (true) {
            sc.service();
            try {
                Thread.sleep(300L);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
class Main {
    public static void main(String[] args) {
        MyThread mt1 = new MyThread("初级用户",10);
        mt1.start();//启动线程，start()是Thread类中的一个方法，用于启动一个新的线程并执行run方法
        MyThread mt2 = new MyThread("高级用户",30);
        mt2.start();
    }
}

```

#### 实现步骤

1、设定业务方法

```JAVA
    //业务操作
    public void business(String id,Long val) {
        System.out.println("用户" + id + "业务操作执行" + val +"次");
    }
```

2、设定多线程类，模拟用户调用

```JAVA
class MyThread extends Thread {
    Service sc;
    public MyThread(String id,Integer count){
        sc = new Service(id,count);
    }
    public void run() {
        while (true) {
            sc.service();
            try {
                Thread.sleep(300L);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

3、设计redis控制方案

```JAVA
    //控制单元
    public void service() {
        Jedis jedis = new Jedis("127.0.0.1", 6379);
        //获取到值
        String value = jedis.get("compid" + id);
        //判断该值是否存在
        try {
            if (value == null) {
                //不存在，创建该值
                jedis.setex("compid" + id, 5, Long.MAX_VALUE - count + "");

            } else {
                //存在，自增，调用业务
                Long val = jedis.incr("compid" + id);
                business(id,count-(Long.MAX_VALUE - val));
            }
        } catch (JedisDataException e) {
            System.out.println("使用到达次数上限，请升级会员级别");
            return;
        } finally {
            jedis.close();
        }
    }
```

4、设计启动主程序

```JAVA
class Main {
    public static void main(String[] args) {
        MyThread mt1 = new MyThread("初级用户",10);
        mt1.start();//启动线程，start()是Thread类中的一个方法，用于启动一个新的线程并执行run方法
        MyThread mt2 = new MyThread("高级用户",30);
        mt2.start();
    }
}
```

### Jedis简易工具类开发

基于连接池获取连接

- JedisPoll：Jedis提供的连接池技术
  - poolConfig：连接池配置对象
  - host：redis服务地址
  - port：redis服务端口号

```JAVA
static{
        ResourceBundle rb = ResourceBundle.getBundle("redis");

        JedisPoolConfig jpc = new JedisPoolConfig();
        jpc.setMaxTotal(Integer.parseInt(rb.getString("redis.maxTotal")));
        jpc.setMaxIdle(Integer.parseInt(rb.getString("redis.maxIdle")));//活动连接数
        String host = rb.getString("redis.host");
        int port = Integer.parseInt(rb.getString("redis.port"));
        jp = new JedisPool(jpc, host,port);
    }
```

# Redis高级

## Linux虚拟机启动redis

- 下载安装包
  - wget http://download.redis.io/releases/redis-?.?.?/tar.gz
- 解压
  - tar-xvf 文件名.tar.gz
- 编译
  - make
- 安装
  - make install
- 启动redis
  - ./redis-server
- 启动端口
  - ./redis-cli

- 指定端口启动服务
  - ./redis-server --port 6380
- 查看redis.conf文件简化
  - cat redis.conf | grep -v "#" |grep -v "^$"

- 默认配置启动
  - redis-server
  - redis-server --port 6379(端口号)
- 指定配置文件启动
  - redis-server redis.conf
  - redis-server redis.6379.conf
  - redis-server conf/redis.6379.conf
- Redis客户端连接
  - 默认连接
    - redis-cli
  - 连接指定服务器
    - redis-cli -h 127.0.0.1
    - redis-cli -p 6379
    - redis-cli -h 127.0.0.1 -p 6379
- Redis服务端配置
  - 基本配置
    - daemonize yes
      - 以守护进程方式启动，使用本启动方式，redis将以服务的形式存在，日志将不再打印到命令窗口中
    - port 6***
      - 设定当前服务启动端口号
    - dir "/自定义目录/redis/data"
      - 设定当前服务文件保存位置，包含日志文件、持久化文件
    - logfile "6***.conf"
      - 设定日志文件名，便于查阅

## 持久化简介

“自动备份”

![](Redis学习/自动备份.png)

### 什么是持久化

利用永久性存储介质将数据进行保存，在特定的时间<span style = "color:red">将保存的数据进行恢复</span>的工作机制成为持久化

### 为什么要进行持久化

防止数据的意外丢失，确保数据安全性

### 持久化过程保存什么

- 将当前数据状态进行保存，<span style = "color:red">快照形式</span>，存储数据结果，存储格式简单，关注点在数据----------二进制数据

- 将数据的操作过程进行保存，<span style = "color:red">日志形式</span>，存储操作过程，存储格式复杂，关注点在数据的操作过程

### RDB

#### 启动方式——save指令

- 命令
  - save
  
    - dbfilename dump.rdb
      - 说明：设置把本地数据文件名，默认为dump.rdb
      - 经验：通常设置为<span style = "color :blue">dump</span>-<span style = "color:red">端口号</span>.<span style = "color :blue">rdb</span>
    - dir
      - 说明：设置<span style = "color:red">存储.rdb文件的路径</span>
      - 经验：通常设置成存储空间较大的目录中，<span style = "color:red">目录名称data</span>
    - rdbcompression yes
      - 说明：设置存储至本地数据库时<span style = "color:red">是否压缩数据</span>，默认为yes，采用LZF压缩
      - 经验：通常默认为开启状态，如果设置为no，可以节省CPU运行时间，但会使存储的文件变大(巨大)
    - rdbchecksum yes
      - 说明：设置是否进行RDB文件格式校验，该校验过程在写文件和读文件过程均进行
      - 经验：通常默认为开启状态，<span style = "color:red">如果设置为no，可以节约读写性过程约10%时间消耗，但是存储一定的数据损坏风险</span>
  
  - 在端口中使用了save命令之后会在redis文件中的data文件中生成一个dump.rdb的文件![](Redis学习/save.png)
  
  - 自我理解描述
  
    - 通常我们使用了save命令之后，会生成dump-端口号.rdb的文件，我们save之后数据都在该文件之中，启动redis服务的时候，这些数据就会加载进来
  
  - 工作原理
  
    ![](Redis学习/save指令工作原理.png)
  
    - <span style = "color:red">注意</span>：save指令的执行会阻塞当前Redis服务器，直到当前RDB过程完成为止，有可能会造成长时间阻塞，<span style = "color:red">线上环境不建议使用</span>
  
- 作用
  
  - 手动执行一次保存操作
  
- 数据量过大，单线程执行方式造成效率过低如何处理？——<span style = "color:red">后台执行即可</span>

#### 启动方式——bgsave指令

- 命令
  - bgsave
- 作用
  - 手动启动<span style = "color:red">后台</span>保存操作，但不是立即执行
- 指令工作原理![](Redis学习/bgsave工作原理.png)
-  注意：bgsave命令是<span style = "color:red">针对save阻塞问题做的优化</span>。Redis内部所有涉及到RDB操作都采用bgsave方式，save命令可以放弃使用
- bgsave指令相关配置
  - dbfilename dump.rdb
  - dir
  - rdbcompression yes
  - rdbchecksum yes
  - stop-writes-on-bgsave-error yes
    - 说明：后台存储过程中如果出现错误现象，是否停止保存操作
    - 经验：通常默认为开启状态

#### save配置

- 配置

  - save second changes-------------在second秒内执行changes个key就会进行持久化，但是如果超时了，会再次执行他会把之前的key快照回去

- 作用

  - 满足<span style = "color:red">限定时间范围内key的变化数量达到指定数量</span>即进行持久化

- 参数

  - second：监控时间范围
  - changes：监控key的变化量

- 位置

  - 在conf文件中进行配置

- 范例

  - save 900 1
  - save 300 10 
  - save 60 10000

- 原理

  ![](Redis学习/save配置原理.png)

  - 注意：
    - save配置要根据实际业务情况进行设置，频度过高或过低都会出现性能问题，结果可能是灾难性的
    - save配置中对于second与changes设置通常具有互补对应关系，尽量不要设置成包容性关系
    - save配置启动后执行的是bgsave操作

#### 三种启动方式对比

| 方式           | save指令 | bgsave指令   |
| -------------- | -------- | ------------ |
| 读写           | 同步     | 异步(挂后台) |
| 阻塞客户端指令 | 是       | 否           |
| 额外内存消耗   | 否       | 是           |
| 启动新进程     | 否       | 是           |

#### rdb特殊启动形式

- 全量复制
  - 从主从复制中详细讲解
- 服务器运行过程中重启
  - debug reload
- 关闭服务器时指定保存数据
  - shutdown save

#### RDB优点

- RDB是一个紧凑压缩的<span style = "color:red">二进制</span>文件，存储效率较高
- RDB内部存储的是redis在某个时间点的数据快照，非常适用于数据备份，全量复制等场景
- RDB恢复数据的速度要比AOF快很多
- 应用：服务器中每X小时执行bgsave备份，并将RDB文件拷贝到远程机器中，用于灾难恢复

#### RDB缺点

- RDB方式无论是执行指令还是利用配置，<span style = "color:red">无法做到实时持久化</span>，具有较大的可能性丢失数据
- bgsave指令<span style = "color:red">每次运行要执行fork操作创建子进程</span>，要牺牲掉一些性能
- Redis的<span style = "color:red">众多版本中未进行RDB文件格式的版本统一</span>，有可能出现各版本服务之间数据格式无法兼容

### AOF

#### RED存储的弊端

- <span style = "color:red">存储数据量较大</span>，效率较低
  - 基于快照思想，<span style = "color:red">每次读写都是全部数据</span>，当数据量巨大时，效率非常低
- 大数据量下的IO性能较低
- 基于fork创建子进程，内存产生额外消耗
- 宕机带来的数据丢失风险

#### 解决思路

- 不写全数据，仅记录部分数据
- <span style = "color:red">改记录数据为记录操作过程</span>
- 对所有操作均进行记录，排除丢失数据的风险

#### AOF概念

- AOF（append only file）持久化：以<span style = "color:red">独立日志</span>的方式<span style = "color:blue">记录每次写命令</span>，<span style = "color:red">重启时再重新执行AOF文件中命令</span>达到恢复数据的目的。与RDB相比可以简单描述为<span style = "color:red">改记录数据为记录数据产生的过程</span>
- AOF主要作用是解决了数据持久化的实时性，目前已经是Redis持久化的主流方式。

#### AOF写数据过程

![](Redis学习/AOF写数据过程.jpg)

#### AOF写数据三种策略（appendfsync）

- always(每次)
  - **每次**写入操作均同步到AOF文件中，<span style = "color:red">数据零误差，性能较低</span>![](Redis学习/always.png)
- everysec(每秒)
  - **每秒**将缓冲区中的指令同步到AOF文件中，<span style = "color:red">数据准确性较高，性能较高</span>
  - 在系统突然宕机的情况下丢失1秒内的数据 
- no(系统控制)
  - 由操作系统控制每次同步到AOF文件的周期，整体过程<span style = "color:red">不可控</span>

#### AOF功能开启

- 配置
  - appendonly yes|no
- 作用
  - 是否开启AOF持久化功能，默认为不开启状态
- 配置
  - appendfsync alway|everyesc|no
- 作用
  - AOF写数据策略

#### AOF相关配置

- 配置
  - appendfilename filename
- 作用
  - AOF持久化文件名，默认文件名为appendonly.aof，建议配置为appendonly-端口号.aof
- 配置
  - dir
- 作用
  - AOF持久化文件保存路径，与 RDB持久化文件保持一致即可

#### AOF写数据遇到的问题

- 如果连续执行同一个key的更新处理该如何处理
  - 只保留最后一个

#### AOF重写

随着命令不断写入AOF，文件会越来越大，为了解决这个问题，Redis引入了AOF重写机制压缩文件体积。AOF文件重写是将Redis进程内的数据转化为写命令同步到新AOF文件的过程。简单说就是<span style = "color:red">将对同一个数据的若干条命令执行结果转化最终结果数据对应的指令进行记录</span>。

#### AOF重写作用

- 降低磁盘占用量，提高磁盘利用率
- 提高持久化效率，降低持久化写时间，提高IO性能
- 降低数据恢复用时，提高数据恢复效率

#### AOF重写规则

- 进程内已超时的数据不再写入文件
- 忽略无效指令，重写时使用进程内数据直接生成，这样新的AOF文件只保留最终数据的写入命令，如del key1、hdel key2、srem key3、set key4 111、set key4 222等
- 对同一数据的多条写命令合并为一条命令，如lpush list1 a、lpush list1 b、lpush list1 c可以转化为：lpush list1 a b c。
  - 为防止数据过大造成客户端缓冲区溢出，对list、set、hash、zset等类型，每条指令最多写入64个元素

#### AOF重写方式

- 手动重写
  - bgrewriteaof
- 自动重写
  - auto-aof-rewrite-min-size size
  - auto-aof-rewrite-percentage percentage

#### AOF手动重写-bgrewriteaof指令工作原理

![](Redis学习/bgrewriteaof.png)

#### AOF自动重写方式

- 自动重写触发条件设置
  - auto-aof-rewrite-min-size size
  - auto-aof-rewrite-percentage percentage
- 自动重写触发比对参数（运行指令info Persistence获取具体信息）
  - aof_current_size
  - aof_base_size
- 自动重写触发条件
  - aof_current_size>auto-aof-rewrite-min-size
  - aof_current_size-aof_base_size/aof_base_size>=auto-aof-rewrite-percentage

#### AOF重写流程

![](Redis学习/aof重写流程(1).png)![](Redis学习/AOF重写流程2.png)

#### RDB与AOF区别

| 持久化方式   | RDB             | AOF                |
| ------------ | --------------- | ------------------ |
| 占用存储空间 | 小(数据级:压缩) | 大（指令级：重写） |
| 存储速度     | 慢              | 快                 |
| 恢复速度     | 快              | 慢                 |
| 数据安全性   | 会丢失数据      | 依据策略决定       |
| 资源消耗     | 高/重量级       | 低/轻量级          |
| 启动优先级   | 低              | 高                 |

#### RDB与AOF得选择之惑

- 对数据非常敏感，建议使用默认的AOF持久化方案
  - AOF持久化策略使用everysecond，每秒钟fsync一次。该策略redis仍可以保持很好的处理性能，当出现问题时，最多丢失0-1秒内的数据
  - 注意：由于AOF文件存储体积较大，且恢复速度较慢
- <span style = "color:red">数据呈现阶段有效性</span>，建议使用RDB持久化方案
  - 数据可以良好的做到阶段内无丢失(该阶段是开发者或运维人员手工维护的)，且恢复速度较快，阶段点数据恢复通常采用RDB方案
  - 注意：利用RDB实现紧凑的数据持久化会使Redis降得很低
- 综合比对
  - RDB与AOF的选择实际上是在做一种权衡，每种都有利有弊
  - 如不能承受数分钟以内的数据丢失，对业务数据非常敏感，选用AOF
  - 如能承受数分钟以内的数据丢失，且追求大数据集的恢复速度，选用RDB
  - 灾难恢复选用RDB
  - 双保险策略，同时开启RDB和AOF，重启后，Redis优先使用AOF来恢复数据，降低丢失数据的量

#### 持久化应用场景

我的理解是短时间需要的数据缓存，数据不丢失，故障后可以快速恢复

## 事务

### 事务简介

在执行redis指令过程中，多条连续执行的指令<span style = "color:red">被干扰，打断，插队</span>![](Redis学习/事务打断.png)

redis事务就是一个命令执行的队列，将一系列预定义命令<span style = "color:red">包装成一个整体(一个队列)</span>。<span style = "color:red">当执行时，一次性按照添加顺序依次执行，中间不会被打断或者干扰</span>

### 事务基本操作

#### 事务的边界

- 开启事务
  - multi
- 作用
  - 设定事务的<span style = "color:red">开启位置</span>，此指令执行后，后续的所有指令均加入到事务中
- 执行事务
  - exec
- 作用
  - 设定事务的<span style = "color:red">结束位置</span>，同时执行事务。与multi成对出现，成对使用

- 注意
  - 加入事务的命令暂时进入到任务队列中，并没有立即执行，只有执行exec命令才开始执行
  - 如果在MULTI开启事务的时候命令错误，在使用EXEC就会报错出现没有开启事务



#### 事务的基本操作

- 取消事务
  - discard
- 作用
  - 终止当前事务的定义，发生在multi之后，exec之前

#### 事务的工作流程

![](Redis学习/工作流程.png)

#### 事务的注意事项

定义事务的过程中，命令格式输入错误怎么办

- 语法错误
  - 命令书写格式有误
- 处理结果
  - 如果定义的事务中所包含的命令<span style = "color :red">存在语法错误</span>，整体事务中<span style = "color :red">所有命令均不会执行</span>。包括那些语法正确的命令

定义事务的过程中，命令执行出现错误怎么办？

- 运行错误
  - 命令格式正确，但是无法正确的执行。例如对list进行incr操作
- 处理结果
  - 能够正确运行的命令会执行，运行错误的命令不会被执行
- 注意
  - 能够正确运行的命令会执行，运行错误的命令不会被执行

手动进行事务回滚

- 记录操作过程中被影响的数据之前的状态
  - 单数据：string
  - 多数据：hash、list、set、zset
- 设置指令恢复所有的被修改的项
  - 单数据：直接set（注意周边属性，例如时效）
  - 多数据：修改对应值或整体克隆复制

### 锁

#### 基于特定条件的事务执行

##### 业务场景

天猫双11热卖过程中，对已经售罄的货物追加补货，4个业务员都有权限进行补货。补货的操作可能是一系列的操作，牵扯到多个连续操作，如何保障不会重复操作？

##### 业务分析

- 多个客户端有可能同时操作同一组数据，并且该数据一旦被操作修改后，将不适用于继续操作
- 在操作之前锁定要操作的数据，一旦发生变化，终止当前操作

##### 解决方案

- <span style = "color:red">对key添加监视锁</span>，在<span style = "color:blue">执行exec前如果key发生了变化</span>，<span style = "color:red">终止事务执行</span>
  - watch key1 [key2]
- 取消对所有key的监视
  - unwatch

##### 业务场景

天猫双11热卖过程中，对已经售罄的货物追加补货，且补货完成。客户购买热情高涨，3秒内将所有商品购买完毕。本次补货已经将库存全部清空，如何避免最后一件商品不被多人同时购买？（超卖问题）

##### 业务分析

- 使用watch监控一个key有没有改变已经不能解决问题，此处要监控的是具体数据
- 虽然redis是单线程的，但是多个客户端对同一数据同时进行操作时，如何避免不被同时修改

#### 基于特定条件的事务执行——分布式锁

##### 解决方案

- 使用setnx设置一个公共锁
  - setnx lock-key value

利用setnx命令的返回值特征，有值则返回设置失败，无值则返回设置成功

- <span style = "color:red">对于返回设置成功的，拥有控制权</span>，进行下一步的具体业务操作
- 对于返回设置失败的，不具有控制权，<span style = "color:blue">排队或等待</span>

操作完毕通过del操作释放锁

注意：上述解决方案是一种设计概念，依赖规范保障，具有风险性

tips19:

- redis应用基于分布式锁对应的场景控制

#### 基于特定条件的事务执行

##### 业务场景

依赖分布式锁的机制，<span style = "color :red">某个用户操作时对应客户端宕机</span>，且此时已经获取到锁。如何解决？

##### 业务分析

- 由于锁操作由用户控制加锁解锁，必定会存在加锁后未解锁的风险
- 需要解锁操作不能仅依赖用户控制，系统级别要给出对应的保底处理方案

##### 分布式锁改良

###### 解决方案

- 使用expire为锁key添加时间限定，到时不释放，放弃锁
  - expire lock-key second
  - pexpire lock-key milliseconds

由于操作通常都是微妙或毫秒级，因此该<span style = "color:red">锁定时间不宜设置过大</span>。具体时间需要业务测试后确认

- 例如：持有锁的操作最长执行时间127ms，最短执行时间7ms
- 测试百万次最长执行时间对应命令的最大耗时，测试百万次网络延迟平均耗时
- 锁时间设定推荐：最大耗时\*120%+平均网络延迟\*110%
- 如果业务最大耗时<<网络平均延迟，通常为2个数量级，取其中单个耗时较长即可

## 删除策略

### 过期数据

#### Redis中的数据特征

- Redis是一种内存级数据库，所有数据均存放在内存中，内存中的数据可以通过TTL指令获取其状态
  - XX：具有时效性的数据
  - -1：永久有效的数据
  - -2：已经过期的数据 或 被删除的数据 或 未定义的数据

#### 数据删除策略

- 定时删除
- 惰性删除
- 定期删除

### 数据删除策略

#### 时效性数据的存储结构

![](Redis学习/时效性数据的存储结构.png)

#### 数据删除策略的目标

在内存占用与CPU占用之间寻找一种平衡，顾此失彼都会造成整体redis性能的下降，甚至引发服务器宕机或内存泄漏

### 定时删除

- 创建一个定时器，当key设置有过期时间，且<span style = "color:red">过期时间到达时，由定时器任务立即执行对键的删除</span>操作![](Redis学习/定时删除.png)

- 优点：节约内存，到时就删除，快速释放掉不必要的内存占用
- 缺点：CPU压力很大，无论CPU此时负载量多高，均占用CPU，会影响redis服务器响应时间和指令吞吐量
- 总结：用处理器性能换取存储空间

### 惰性删除

- 数据<span style = "color:red">到达过期时间，不做处理</span>。等下次访问该数据时
  - 如果<span style= "color:red">未过期，返回数据</span>
  - 发现<span style= "color:red">已过期，删除，返回不存在</span>,通过expireIfNeeded()进行删除的
- 优点：节约CPU性能，发现必须删除的时候才删除
- 缺点：内存压力很大，出现长期占用内存的数据
- 总结：用存储空间换取处理器性能

### 定期删除

- Redis启动服务器初始化时，读取配置server.hz的值，默认为10
- 每秒钟执行server.hz次serverCron()——>databasesCron()（轮询操作）——>activeExpireCycle()
- activeExpireCycle()对每个expires[*]逐一进行检测，每次执行250ms/server.hz
- <span style = "color:red">对某个expires[*]检测时，随机挑选W个key进行检测</span>
  - 如果key超时，删除key
  - 如果一轮中删除的key的数量>W*25%，循环该过程
  - 如果一轮中删除的key的数量≤W*25%，检查下一个expires[\*]，0-15循环
  - W取值=ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOPS属性值
- 参数current_db用于记录activeExpireCycle()进入哪个expires[\*]执行
- 如果activeExpireCycle()执行时间到期，下次从current_db继续向下执行
