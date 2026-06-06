class ApiError extends Error{
    constructor(
        statuscode,
        message="Something went wrong",
        stack=""
    )
    {
        super(message)   // parent class jo Ki Error buil-in hai use coll kiaya
        this.statuscode=statuscode,
        this.message=message
        if(stack){
            this.stack=stack
        }else{
                Error.captureStackTrace(this,this.constructor)
        }
    }
}

export{ApiError}