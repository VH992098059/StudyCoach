package login

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"backend/internal/model/entity"
	"backend/utility"
	"backend/utility/consts"
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func Login(ctx context.Context, username, password string) (id uint64, uuid, token string, err error) {
	var user entity.Users
	err = dao.Users.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		/*用户查询*/
		err = tx.Model(entity.Users{}).Fields("id", "uuid", "username", "password").Where("username", username).WhereOr("email", username).Scan(&user)
		if err != nil {
			return gerror.NewCode(gcode.New(401, "用户名不存在或查询失败", ""))
		}
		// 检查是否查到了数据
		if user.Id == 0 {
			return gerror.NewCode(gcode.New(401, "用户名不存在", ""))
		}

		/*密码验证*/
		passwordComparison := utility.Verify(password, user.Password)
		if !passwordComparison {
			return gerror.NewCode(gcode.New(401, "用户名或密码错误", ""))
		}
		// 更新最后登录时间
		_, err = tx.Model(entity.Users{}).Where("id", user.Id).Fields("last_login_at", "status").Data(
			do.Users{
				LastLoginAt: gtime.Now(),
				Status:      "active",
			}).Unscoped().Update()
		return err

	})
	if err != nil {
		return 0, "", "", err
	}

	/*JWT生成*/
	us := &utility.JwtClaims{
		Id:       user.Id,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}
	signedString, err := jwt.NewWithClaims(jwt.SigningMethodHS512, us).SignedString([]byte(consts.JwtKey))
	if err != nil {
		log.Println(err)
		return 0, "", "", err
	}

	/*JWT存储Redis*/
	err = utility.SetJWT(ctx, user.Username, signedString, 3600*24) //设置24小时
	if err != nil {
		log.Println("redis出错！")
		return 0, "", "", gerror.New("缓存存储失败！")
	}
	return user.Id, user.Uuid, signedString, nil
}
func RegisterUser(ctx context.Context, in *entity.Users) (id int64, err error) {
	/*查询用户是否注册*/
	isExistUser, err := dao.Users.Ctx(ctx).Where("username", in.Username).Count()
	if err != nil {
		return 0, err
	}
	if isExistUser > 0 {
		return 0, gerror.New("用户已存在")
	}

	isExistEmail, err := dao.Users.Ctx(ctx).Where("email", in.Email).Count()
	if err != nil {
		return 0, err
	}
	if isExistEmail > 0 {
		return 0, gerror.NewCode(gcode.New(409, "邮箱已存在", ""))
	}

	/*用户注册*/
	encryptPassword, _ := utility.Encrypt(in.Password)
	uuidUser := strings.ReplaceAll(uuid.New().String(), "-", "")
	getId, err := dao.Users.Ctx(ctx).Data(entity.Users{
		Username:  in.Username,
		Password:  encryptPassword,
		Uuid:      uuidUser,
		Email:     in.Email,
		Status:    "inactive",   //默认未激活
		AvatarUrl: "avatar.png", //默认头像
	}).InsertAndGetId()
	if err != nil {
		return 0, err
	}
	return getId, nil
}

func LogoutUser(ctx context.Context) (msg string, err error) {
	/*获取JWT字段*/
	jwtMap, err := utility.JWTMap(ctx)
	if err != nil {
		return "", gerror.NewCode(gcode.New(500, "token有误，退出失败", ""))
	}
	log.Println("jwt的ID：", jwtMap["Id"].(float64))
	log.Println("jwt的Username：", jwtMap["Username"].(string))
	_, err = dao.Users.Ctx(ctx).Fields("logout_at").Where("id", jwtMap["Id"].(float64)).Data(do.Users{LogoutAt: gtime.Now()}).Update()
	if err != nil {
		return "", gerror.NewCode(gcode.New(500, "退出失败", ""))
	}

	/*检查JWT是否存在*/
	userKey := fmt.Sprintf("user:%s", jwtMap["Username"].(string))
	checkJWT, err := utility.CheckJWT(ctx, userKey, utility.GetJWT(ctx))
	if err != nil {
		return "", gerror.NewCode(gcode.New(500, "token检查失败，退出失败", ""))
	}

	/*JWT实现黑名单*/
	checkJWTBlack, err := utility.CheckBlackTokens(ctx, jwtMap["Username"].(string), utility.GetJWT(ctx))
	if err != nil {
		return "", gerror.NewCode(gcode.New(500, "退出失败", ""))
	}
	if !checkJWT || checkJWTBlack {
		return "", gerror.NewCode(gcode.CodeInvalidParameter, "token已失效或不存在")
	}
	err = utility.AddBlackTokens(ctx, jwtMap["Username"].(string), utility.GetJWT(ctx))
	if err != nil {
		return "", gerror.NewCode(gcode.CodeInvalidParameter, "退出失败")
	}

	/*Redis删除token*/
	utility.DeleteJWT(ctx, jwtMap["Username"].(string))
	return "退出成功", nil
}
