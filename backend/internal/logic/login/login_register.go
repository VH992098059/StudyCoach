package login

import (
	"backend/internal/dao"
	"backend/internal/model/entity"
	"backend/utility"
	"backend/utility/consts"
	"context"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func LoginUser(ctx context.Context, username, password string) (id, uuid, token string, err error) {

	var user entity.Users
	if username != "" {
		err = dao.Users.Ctx(ctx).Fields("id", "uuid", "username", "password_hash").Where("username", username).Scan(&user)
		if err != nil {
			return "", "", "", gerror.NewCode(gcode.New(401, "用户名不存在", ""))
		}
	}
	passwordComparison := utility.Verify(password, user.PasswordHash)
	if !passwordComparison {
		return "", "", "", gerror.NewCode(gcode.New(401, "用户名或密码错误", ""))
	}
	us := &utility.JwtClaims{
		Id:       uint(user.Id),
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}
	//jwt加密
	signedString, err := jwt.NewWithClaims(jwt.SigningMethodHS512, us).SignedString([]byte(consts.JwtKey))
	if err != nil {
		log.Println(err)
		return "", "", "", err
	}
	//存储Redis
	err = utility.SetJWT(ctx, user.Username, signedString, 3600*24) //设置24小时
	if err != nil {
		log.Println("出错啦！")
		return "", "", "", gerror.New("缓存存储失败！")
	}
	return strconv.FormatUint(user.Id, 10), user.Uuid, signedString, nil
}
func RegisterUser(ctx context.Context, in *entity.Users) (id int, err error) {
	isExistUser, err := dao.Users.Ctx(ctx).Where("username", in.Username).Count()
	if err != nil {
		return 0, err
	}
	if isExistUser > 0 {
		return 0, gerror.NewCode(gcode.New(409, "用户已存在", ""))
	}
	encryptPassword, _ := utility.Encrypt(in.PasswordHash)
	uuidUser := strings.ReplaceAll(uuid.New().String(), "-", "")

	getId, err := dao.Users.Ctx(ctx).Data(entity.Users{
		Username:     in.Username,
		PasswordHash: encryptPassword,
		Uuid:         uuidUser,
		Email:        in.Email,
		Status:       "inactive", //默认未激活
	}).InsertAndGetId()
	if err != nil {
		return 0, err
	}
	return int(getId), nil
}
