# Pydantic库完全指南 - 从基础到Flow360应用

## 1. Pydantic基础概念

### 1.1 什么是Pydantic？

Pydantic是一个Python数据验证和序列化库，它基于Python类型提示来进行数据验证、序列化和文档生成。它的核心理念是"解析，不要验证"（Parse, don't validate）。

### 1.2 核心特性
- **类型安全**：基于Python类型提示进行数据验证
- **自动验证**：在数据赋值时自动进行类型检查和格式验证
- **JSON序列化**：提供高效的JSON序列化和反序列化
- **配置灵活**：支持丰富的配置选项和自定义验证器
- **性能优化**：使用Rust编写的pydantic-core提供高性能验证

### 1.3 安装和导入

```bash
pip install pydantic
```

```python
import pydantic as pd
from pydantic import BaseModel, Field, validator
```

## 2. Pydantic基础用法

### 2.1 创建基本模型

```python
from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: int
    name: str
    email: str
    age: Optional[int] = None
    is_active: bool = True

# 创建实例
user = User(
    id=1,
    name="张三",
    email="zhangsan@example.com",
    age=25
)

print(user.name)  # 张三
print(user.model_dump())  # 转为字典
print(user.model_dump_json())  # 转为JSON字符串
```

### 2.2 数据验证

Pydantic会自动进行类型转换和验证：

```python
class Product(BaseModel):
    name: str
    price: float
    quantity: int

# 自动类型转换
product = Product(
    name="苹果",
    price="9.99",  # 字符串会被转换为float
    quantity="10"   # 字符串会被转换为int
)

print(product.price)  # 9.99 (float类型)
print(product.quantity)  # 10 (int类型)

# 验证失败的例子
try:
    invalid_product = Product(
        name="香蕉",
        price="not_a_number",  # 无法转换为float
        quantity=5
    )
except ValueError as e:
    print(f"验证错误: {e}")
```

### 2.3 使用Field进行高级配置

```python
from pydantic import Field

class Student(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="学生姓名")
    age: int = Field(..., gt=0, le=120, description="学生年龄，必须大于0小于等于120")
    grade: float = Field(0.0, ge=0.0, le=100.0, description="成绩，0-100分")
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$', description="有效的邮箱地址")
    
    class Config:
        # 生成JSON Schema时的配置
        schema_extra = {
            "example": {
                "name": "李四",
                "age": 20,
                "grade": 95.5,
                "email": "lisi@university.edu"
            }
        }

# 使用示例
student = Student(
    name="王五",
    age=22,
    grade=88.5,
    email="wangwu@email.com"
)
```

### 2.4 数据类型支持

Pydantic支持丰富的Python类型：

```python
from datetime import datetime, date
from typing import List, Dict, Set, Tuple, Union
from enum import Enum

class Status(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

class ComplexModel(BaseModel):
    # 基本类型
    text: str
    number: int
    decimal: float
    flag: bool
    
    # 时间类型
    created_at: datetime
    birth_date: date
    
    # 容器类型
    tags: List[str]
    metadata: Dict[str, str]
    unique_values: Set[int]
    coordinates: Tuple[float, float]
    
    # 联合类型
    value: Union[int, str]
    
    # 枚举类型
    status: Status
    
    # 可选类型
    description: Optional[str] = None

# 使用示例
data = {
    "text": "示例文本",
    "number": 42,
    "decimal": 3.14,
    "flag": True,
    "created_at": "2023-01-01T12:00:00",
    "birth_date": "1990-05-15",
    "tags": ["python", "pydantic"],
    "metadata": {"key1": "value1", "key2": "value2"},
    "unique_values": [1, 2, 3, 3],  # 自动去重
    "coordinates": [39.9042, 116.4074],
    "value": "text_value",
    "status": "active"
}

model = ComplexModel(**data)
```

## 3. 验证器和自定义验证

### 3.1 字段验证器

```python
from pydantic import field_validator

class UserProfile(BaseModel):
    username: str
    password: str
    confirm_password: str
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not v.isalnum():
            raise ValueError('用户名只能包含字母和数字')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('密码长度至少8位')
        return v

# Pydantic v2 中的模型验证器
from pydantic import model_validator

class UserRegistration(BaseModel):
    username: str
    password: str
    confirm_password: str
    
    @model_validator(mode='after')
    def validate_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError('两次输入的密码不匹配')
        return self
```

### 3.2 根验证器和复杂验证逻辑

```python
class Rectangle(BaseModel):
    width: float
    height: float
    area: Optional[float] = None
    
    @model_validator(mode='after')
    def validate_area(self):
        if self.area is not None:
            calculated_area = self.width * self.height
            if abs(self.area - calculated_area) > 0.01:
                raise ValueError(f'面积不匹配: 提供的面积 {self.area}, 计算的面积 {calculated_area}')
        else:
            self.area = self.width * self.height
        return self
```

## 4. 配置和自定义

### 4.1 模型配置 (Config类)

```python
class ConfiguredModel(BaseModel):
    name: str
    value: int
    
    class Config:
        # 验证配置
        validate_assignment = True  # 赋值时验证
        validate_default = True     # 验证默认值
        extra = 'forbid'           # 禁止额外字段
        
        # 序列化配置
        use_enum_values = True     # 使用枚举值而不是名称
        populate_by_name = True    # 允许使用字段名和别名
        
        # 其他配置
        frozen = False             # 模型是否不可变
        str_strip_whitespace = True  # 自动去除字符串空白

# Pydantic v2 中使用 ConfigDict
from pydantic import ConfigDict

class ModernModel(BaseModel):
    model_config = ConfigDict(
        validate_assignment=True,
        extra='forbid',
        frozen=False,
        str_strip_whitespace=True
    )
    
    name: str
    value: int
```

### 4.2 字段别名和序列化

```python
from pydantic import Field, AliasGenerator

class APIResponse(BaseModel):
    user_id: int = Field(alias='userId')  # JSON中使用userId，Python中使用user_id
    full_name: str = Field(alias='fullName')
    created_time: datetime = Field(alias='createdAt')

# 使用别名生成器
class CamelCaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=AliasGenerator(
            serialization_alias=lambda field_name: ''.join(
                word.capitalize() if i > 0 else word 
                for i, word in enumerate(field_name.split('_'))
            )
        ),
        populate_by_name=True
    )
    
    user_name: str
    email_address: str
    phone_number: str

# JSON输入使用别名
json_data = {
    "userId": 1,
    "fullName": "张三",
    "createdAt": "2023-01-01T00:00:00"
}

response = APIResponse(**json_data)
print(response.user_id)  # 1
print(response.full_name)  # 张三

# 序列化时使用别名
print(response.model_dump(by_alias=True))
# {'userId': 1, 'fullName': '张三', 'createdAt': '2023-01-01T00:00:00'}
```

## 5. 高级特性

### 5.1 嵌套模型

```python
class Address(BaseModel):
    street: str
    city: str
    country: str
    zip_code: str

class Person(BaseModel):
    name: str
    age: int
    address: Address  # 嵌套模型
    addresses: List[Address] = []  # 嵌套模型列表

# 使用嵌套数据
person_data = {
    "name": "李明",
    "age": 30,
    "address": {
        "street": "长安街1号",
        "city": "北京",
        "country": "中国",
        "zip_code": "100000"
    },
    "addresses": [
        {
            "street": "淮海路100号",
            "city": "上海", 
            "country": "中国",
            "zip_code": "200000"
        }
    ]
}

person = Person(**person_data)
print(person.address.city)  # 北京
```

### 5.2 继承和多态

```python
class Animal(BaseModel):
    name: str
    species: str

class Dog(Animal):
    breed: str
    is_good_boy: bool = True

class Cat(Animal):
    lives_remaining: int = 9
    is_indoor: bool

# 多态处理
from typing import Union

class Pet(BaseModel):
    animal: Union[Dog, Cat]
    owner: str

# 使用discriminated union获得更好的性能
from typing import Annotated
from pydantic import Field

class AnimalWithType(BaseModel):
    animal_type: str
    name: str

class DogWithType(AnimalWithType):
    animal_type: str = Field(default="dog", frozen=True)
    breed: str

class CatWithType(AnimalWithType):  
    animal_type: str = Field(default="cat", frozen=True)
    lives_remaining: int = 9

# 使用discriminated union
AnimalUnion = Annotated[
    Union[DogWithType, CatWithType],
    Field(discriminator='animal_type')
]

class PetStore(BaseModel):
    animals: List[AnimalUnion]
```

## 6. JSON Schema和文档生成

```python
# 自动生成JSON Schema
schema = Student.model_json_schema()
print(schema)

# 自定义Schema
class DocumentedModel(BaseModel):
    """这是一个有文档的模型"""
    
    name: str = Field(
        ..., 
        title="姓名",
        description="用户的真实姓名",
        example="张三"
    )
    age: int = Field(
        ...,
        title="年龄", 
        description="用户年龄，必须大于0",
        gt=0,
        example=25
    )
    
    class Config:
        schema_extra = {
            "title": "用户模型",
            "description": "用于表示系统用户的数据模型"
        }
```

## 7. Flow360项目中的应用

在Flow360项目中，Pydantic作为核心依赖库，为整个仿真框架提供了强大的数据模型支持。

## 2. 在Flow360中的核心应用

### 2.1 基础模型架构

在Flow360中，所有的数据模型都继承自`Flow360BaseModel`，这是一个扩展的Pydantic BaseModel：

```python
class Flow360BaseModel(pd.BaseModel):
    """Flow360所有组件继承的基础pydantic模型"""
    
    model_config = ConfigDict(
        # Pydantic核心配置
        arbitrary_types_allowed=True,    # 允许任意类型
        extra="forbid",                  # 禁止额外字段
        frozen=False,                    # 模型可变
        populate_by_name=True,           # 支持别名填充
        validate_assignment=True,        # 赋值时验证
        validate_default=True,           # 验证默认值
        
        # Flow360自定义配置
        require_one_of=[],               # 必须提供其中一个字段
        allow_but_remove=[],             # 允许但移除的字段
        conflicting_fields=[],           # 冲突字段检查
        include_hash=False,              # 包含哈希
        include_defaults_in_schema=True, # schema中包含默认值
        
        # 别名生成器（snake_case转camelCase）
        alias_generator=pd.AliasGenerator(
            serialization_alias=snake_to_camel,
        ),
    )
```

### 2.2 实体系统架构

`EntityBase`是所有仿真实体的基类，展示了Pydantic在实体管理中的应用：

```python
class EntityBase(Flow360BaseModel, metaclass=ABCMeta):
    """动态实体类型的基类"""
    
    # 类级别的桶标识符
    entity_bucket: ClassVar[str] = "Invalid"
    
    # 使用pd.Field定义字段属性
    private_attribute_entity_type_name: str = "Invalid"
    private_attribute_id: Optional[str] = pd.Field(
        None,
        frozen=True,  # 不可变字段
        description="实体的唯一标识符"
    )
    name: str = pd.Field(frozen=True)  # 冻结的名称字段
    
    # 私有属性用于缓存
    _dirty: bool = pd.PrivateAttr(True)
    _hash_cache: str = pd.PrivateAttr(None)
```

## 3. 关键概念和特性

### 3.1 Field定义和配置

`pd.Field()`是Pydantic中定义字段属性的核心方法：

```python
# 基本字段定义
name: str = pd.Field(description="实体名称")

# 带验证的字段
temperature: float = pd.Field(gt=0, description="温度必须大于0")

# 冻结字段（不可修改）
type: Literal["air"] = pd.Field("air", frozen=True)

# 可选字段with默认值
viscosity: Optional[float] = pd.Field(None, description="动态粘度")
```

### 3.2 类型验证和约束

Flow360中大量使用了Pydantic的类型验证功能：

```python
# 正数类型
max_edge_length: LengthType.Positive = pd.Field(description="最大边长")

# 非负数类型  
reference_viscosity: ViscosityType.NonNegative = pd.Field(description="参考粘度")

# 受限整数
number_of_layers: pd.PositiveInt = pd.Field(description="层数")

# 联合类型with discriminator
dynamic_viscosity: Union[Sutherland, ViscosityType.NonNegative] = pd.Field(
    description="动态粘度模型或值"
)
```

### 3.3 模型验证器

Pydantic提供了多种验证器来实现复杂的验证逻辑：

#### 3.3.1 模型级验证器（model_validator）

```python
@pd.model_validator(mode="before")
@classmethod
def one_of(cls, values):
    """require_one_of验证器：确保提供必需字段中的至少一个"""
    if cls.model_config["require_one_of"]:
        set_values = [key for key, v in values.items() if v is not None]
        required_fields = cls.model_config["require_one_of"]
        intersection = list(set(set_values) & set(required_fields))
        if len(intersection) == 0:
            raise ValueError(f"必须提供以下字段中的一个: {required_fields}")
    return values
```

#### 3.3.2 字段级验证器（field_validator）

```python
@pd.field_validator('temperature')
@classmethod
def validate_temperature(cls, v):
    """温度字段验证器"""
    if v < 0:
        raise ValueError('温度不能为负数')
    return v
```

#### 3.3.3 函数调用验证器（validate_call）

```python
@pd.validate_call
def get_dynamic_viscosity(
    self, temperature: AbsoluteTemperatureType
) -> ViscosityType.NonNegative:
    """使用validate_call确保函数参数类型正确"""
    return self.reference_viscosity * calculation(temperature)
```

### 3.4 判别联合（Discriminated Unions）

Flow360大量使用discriminated unions来处理多态性：

```python
# 网格细化类型的判别联合
RefinementTypes = Annotated[
    Union[
        SurfaceEdgeRefinement,
        SurfaceRefinement, 
        BoundaryLayer,
        UniformRefinement,
    ],
    pd.Field(discriminator="refinement_type")  # 使用refinement_type字段区分类型
]

# 具体实现类
class SurfaceEdgeRefinement(Flow360BaseModel):
    refinement_type: Literal["SurfaceEdgeRefinement"] = "SurfaceEdgeRefinement"
    
class BoundaryLayer(Flow360BaseModel):
    refinement_type: Literal["BoundaryLayer"] = "BoundaryLayer"
```

### 3.5 实体列表和元类

Flow360实现了复杂的实体列表系统，使用Pydantic的元类功能：

```python
class EntityList(Flow360BaseModel, metaclass=_EntityListMeta):
    """接受实体列表的类型"""
    
    stored_entities: List = pd.Field()
    
    @classmethod
    def _get_valid_entity_types(cls):
        """获取有效的实体类型"""
        entity_field_type = cls.__annotations__.get("stored_entities")
        # 解析List[Union[EntityTypes]]类型
        return extracted_types
    
    @pd.model_validator(mode="before")
    @classmethod
    def _format_input_to_list(cls, input_data):
        """格式化输入为列表"""
        # 处理列表、字典或单个实体
        return {"stored_entities": processed_entities}
```

## 4. 单位系统集成

Flow360将Pydantic与unyt单位库深度集成：

```python
# 定义带单位的类型
LengthType = Annotated[
    u.unyt_quantity,
    pd.Field(description="长度类型")
]

# 在模型中使用
class MeshingDefaults(Flow360BaseModel):
    surface_max_edge_length: LengthType.Positive = pd.Field(
        description="表面最大边长"
    )
    
# 使用示例
mesh_config = MeshingDefaults(
    surface_max_edge_length=1.0 * u.m  # 1米
)
```

## 5. 配置和序列化

### 5.1 ConfigDict配置

Flow360通过ConfigDict定制Pydantic行为：

```python
model_config = ConfigDict(
    # 核心验证设置
    extra="forbid",              # 严格模式，禁止额外字段
    validate_assignment=True,    # 赋值时验证
    validate_default=True,       # 验证默认值
    
    # 序列化设置
    populate_by_name=True,       # 支持字段名和别名
    alias_generator=AliasGenerator(
        serialization_alias=snake_to_camel,  # 序列化时转换为camelCase
    ),
    
    # Flow360自定义配置
    require_one_of=[],           # 互斥字段验证
    conflicting_fields=[],       # 冲突字段检查
)
```

### 5.2 JSON序列化

```python
# 模型到JSON
json_str = model.model_dump_json()

# JSON到模型  
model = ModelClass.model_validate_json(json_str)

# 字典序列化（with选项）
data_dict = model.model_dump(
    exclude={"private_fields"},
    by_alias=True,  # 使用别名
    exclude_none=True  # 排除None值
)
```

## 6. 性能优化特性

### 6.1 哈希缓存

Flow360实现了智能的哈希缓存机制：

```python
class EntityBase(Flow360BaseModel):
    _dirty: bool = pd.PrivateAttr(True)
    _hash_cache: str = pd.PrivateAttr(None)
    
    def _get_hash(self):
        """哈希生成器，标识两个实体是否相同"""
        if self._dirty or self._hash_cache is None:
            return self._recompute_hash()
        return self._hash_cache
    
    def __setattr__(self, name, value):
        """重写__setattr__标记实体为dirty状态"""
        super().__setattr__(name, value)
        if not name.startswith("_") and not self._dirty:
            self._dirty = True
```

### 6.2 私有属性

使用`pd.PrivateAttr`定义不参与序列化的私有属性：

```python
class EntityBase(Flow360BaseModel):
    # 私有属性不会被序列化
    _dirty: bool = pd.PrivateAttr(True)
    _hash_cache: str = pd.PrivateAttr(None)
    
    # 公共字段会被序列化
    name: str = pd.Field()
```

## 7. 错误处理和验证

### 7.1 验证错误处理

```python
try:
    model = FluidDynamics(**data)
except pd.ValidationError as e:
    # 处理验证错误
    for error in e.errors():
        print(f"字段 {error['loc']}: {error['msg']}")
```

### 7.2 自定义验证逻辑

```python
@pd.model_validator(mode="after")  
def validate_geometry_consistency(self):
    """模型级验证：检查几何一致性"""
    if self.inner_radius >= self.outer_radius:
        raise ValueError("内半径必须小于外半径")
    return self
```

## 8. 最佳实践总结

1. **类型安全优先**：充分利用Python类型提示和Pydantic验证
2. **字段文档化**：为所有字段提供清晰的description
3. **合理使用frozen**：对不应修改的字段使用frozen=True
4. **验证器分层**：在合适的层级使用field_validator和model_validator
5. **性能考虑**：使用私有属性和缓存机制优化性能
6. **错误处理**：提供有意义的错误信息和验证逻辑

Pydantic在Flow360项目中不仅提供了基础的数据验证功能，更构建了整个框架的类型安全基础，使得复杂的仿真参数配置变得可靠和易于维护。

## 9. Pydantic序列化和反序列化深度解析

### 9.1 序列化控制详解

#### 9.1.1 字段序列化控制

```python
from pydantic import BaseModel, Field, PrivateAttr
from typing import ClassVar, Optional

class SerializationExample(BaseModel):
    # 普通字段 - 会被序列化
    name: str
    age: int
    
    # 使用Field配置的字段 - 会被序列化
    email: str = Field(description="用户邮箱")
    
    # 私有属性 - 不会被序列化
    _internal_id: str = PrivateAttr(default="internal_123")
    
    # 类变量 - 不会被序列化
    MODEL_VERSION: ClassVar[str] = "1.0.0"
    
    # 可选字段 - 根据值决定是否序列化
    optional_field: Optional[str] = None

example = SerializationExample(
    name="张三",
    age=25,
    email="zhangsan@example.com"
)

# 标准序列化
print("标准序列化:", example.model_dump())
# 输出: {'name': '张三', 'age': 25, 'email': 'zhangsan@example.com', 'optional_field': None}

# 排除None值
print("排除None值:", example.model_dump(exclude_none=True))
# 输出: {'name': '张三', 'age': 25, 'email': 'zhangsan@example.com'}

# 排除特定字段
print("排除age字段:", example.model_dump(exclude={'age'}))
# 输出: {'name': '张三', 'email': 'zhangsan@example.com', 'optional_field': None}

# 只包含特定字段
print("只包含name和age:", example.model_dump(include={'name', 'age'}))
# 输出: {'name': '张三', 'age': 25}
```

#### 9.1.2 自定义序列化器

```python
from pydantic import field_serializer, model_serializer
from datetime import datetime

class CustomSerializationModel(BaseModel):
    name: str
    created_at: datetime
    tags: list[str]
    
    @field_serializer('created_at')
    def serialize_datetime(self, dt: datetime, _info):
        """自定义日期时间序列化"""
        return dt.strftime("%Y年%m月%d日 %H:%M:%S")
    
    @field_serializer('tags')  
    def serialize_tags(self, tags: list[str], _info):
        """自定义标签序列化"""
        return ",".join(tags)

model = CustomSerializationModel(
    name="测试",
    created_at=datetime(2023, 12, 25, 10, 30, 0),
    tags=["python", "pydantic", "教程"]
)

print(model.model_dump())
# 输出: {
#     'name': '测试', 
#     'created_at': '2023年12月25日 10:30:00',
#     'tags': 'python,pydantic,教程'
# }
```

### 9.2 反序列化和数据转换

#### 9.2.1 从不同数据源创建模型

```python
class FlexibleModel(BaseModel):
    name: str
    age: int
    score: float

# 从字典创建
dict_data = {"name": "李四", "age": "30", "score": "95.5"}
model1 = FlexibleModel(**dict_data)

# 从JSON字符串创建
json_str = '{"name": "王五", "age": 25, "score": 88.0}'
model2 = FlexibleModel.model_validate_json(json_str)

# 从其他对象创建
class SimpleObject:
    def __init__(self):
        self.name = "赵六"
        self.age = 35
        self.score = 92.5

obj = SimpleObject()
model3 = FlexibleModel.model_validate(obj.__dict__)

print(f"模型1: {model1}")
print(f"模型2: {model2}")  
print(f"模型3: {model3}")
```

#### 9.2.2 数据预处理和转换

```python
from pydantic import model_validator

class DataTransformModel(BaseModel):
    name: str
    email: str
    phone: str
    
    @model_validator(mode='before')
    @classmethod
    def preprocess_data(cls, data):
        """数据预处理"""
        if isinstance(data, dict):
            # 规范化邮箱格式
            if 'email' in data:
                data['email'] = data['email'].lower().strip()
            
            # 规范化电话号码格式
            if 'phone' in data:
                # 移除所有非数字字符
                data['phone'] = ''.join(filter(str.isdigit, str(data['phone'])))
        
        return data

# 使用不规范的数据
messy_data = {
    "name": "张三",
    "email": "  ZhangSan@EXAMPLE.COM  ",
    "phone": "+86-138-0013-8000"
}

clean_model = DataTransformModel(**messy_data)
print(clean_model.model_dump())
# 输出: {
#     'name': '张三',
#     'email': 'zhangsan@example.com', 
#     'phone': '8613800138000'
# }
```

## 10. 错误处理和调试

### 10.1 验证错误处理

```python
from pydantic import ValidationError

class StrictModel(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    age: int = Field(gt=0, le=120)
    email: str = Field(pattern=r'^[^@]+@[^@]+\.[^@]+$')

# 处理验证错误
try:
    invalid_data = {
        "name": "A",  # 太短
        "age": 150,   # 太大
        "email": "invalid_email"  # 格式错误
    }
    model = StrictModel(**invalid_data)
except ValidationError as e:
    print("验证错误详情:")
    for error in e.errors():
        print(f"  字段: {'.'.join(str(loc) for loc in error['loc'])}")
        print(f"  错误: {error['msg']}")
        print(f"  类型: {error['type']}")
        print(f"  输入值: {error['input']}")
        print("  ---")

# 输出类似:
# 验证错误详情:
#   字段: name
#   错误: String should have at least 2 characters
#   类型: string_too_short
#   输入值: A
#   ---
#   字段: age  
#   错误: Input should be less than or equal to 120
#   类型: less_than_equal
#   输入值: 150
#   ---
```

### 10.2 自定义错误消息

```python
class CustomErrorModel(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=20,
        description="用户名长度必须在3-20个字符之间"
    )
    password: str = Field(
        min_length=8,
        description="密码长度至少8位"
    )
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not v.isalnum():
            raise ValueError('用户名只能包含字母和数字，不能包含特殊字符')
        return v
    
    @field_validator('password')
    @classmethod 
    def validate_password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('密码必须包含至少一个大写字母')
        if not any(c.islower() for c in v):
            raise ValueError('密码必须包含至少一个小写字母')
        if not any(c.isdigit() for c in v):
            raise ValueError('密码必须包含至少一个数字')
        return v
```

## 11. 性能优化技巧

### 11.1 使用slots优化内存

```python
class OptimizedModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    name: str
    age: int
    email: str
    
    # 在大量实例场景下，使用slots可以减少内存占用
    __slots__ = ('__dict__', '__pydantic_fields_set__', '__pydantic_extra__')

# 对比内存使用
import sys

class RegularModel(BaseModel):
    name: str
    age: int  
    email: str

regular = RegularModel(name="test", age=25, email="test@example.com")
optimized = OptimizedModel(name="test", age=25, email="test@example.com")

print(f"普通模型大小: {sys.getsizeof(regular)} bytes")
print(f"优化模型大小: {sys.getsizeof(optimized)} bytes")
```

### 11.2 批量验证优化

```python
from typing import List

class BatchModel(BaseModel):
    items: List[OptimizedModel]
    
    @model_validator(mode='before')
    @classmethod
    def optimize_batch_processing(cls, data):
        """批量处理优化"""
        if isinstance(data, dict) and 'items' in data:
            # 预处理批量数据，减少重复验证
            items = data['items']
            if isinstance(items, list) and len(items) > 100:
                # 大批量数据的特殊处理逻辑
                print(f"处理大批量数据: {len(items)} 个项目")
        return data

# 使用示例
large_batch = {
    "items": [
        {"name": f"用户{i}", "age": 20 + i % 50, "email": f"user{i}@example.com"}
        for i in range(1000)
    ]
}

batch_model = BatchModel(**large_batch)
print(f"成功处理 {len(batch_model.items)} 个用户")
```

## 12. 与其他库的集成

### 12.1 与FastAPI集成

```python
# 在FastAPI中使用Pydantic模型
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class UserCreate(BaseModel):
    name: str
    email: str
    age: int

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    age: int
    is_active: bool = True

@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate):
    # FastAPI自动使用Pydantic进行请求验证和响应序列化
    new_user = UserResponse(
        id=1,
        name=user.name,
        email=user.email,
        age=user.age
    )
    return new_user
```

### 12.2 与SQLAlchemy集成

```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel

Base = declarative_base()

class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    email = Column(String(100))

class UserPydantic(BaseModel):
    id: int
    name: str
    email: str
    
    model_config = ConfigDict(from_attributes=True)  # 允许从ORM对象创建

# 从SQLAlchemy对象创建Pydantic模型
def db_user_to_pydantic(db_user: UserDB) -> UserPydantic:
    return UserPydantic.model_validate(db_user)
```

通过这些基础知识的学习，您可以更好地理解Flow360项目中Pydantic的高级应用和设计思路。Pydantic不仅是一个验证库，更是现代Python应用架构的重要基石。