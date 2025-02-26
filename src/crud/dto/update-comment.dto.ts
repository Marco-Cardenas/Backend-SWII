import { ApiProperty } from "@nestjs/swagger";

export class updateCommentDto{
    @ApiProperty()
    comment:string

    @ApiProperty()
    calificacion:number;
}