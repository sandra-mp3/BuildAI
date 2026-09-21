import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsIn(["NEXT_REACT", "REACT_VITE", "STATIC_HTML"])
  framework?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(360)
  accentHue?: number;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
