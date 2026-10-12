import { PartialType } from '@nestjs/swagger';
import { CreateReportScheduleDto } from './create-report-schedule.dto';
import { UpdateReportScheduleDto as IUpdateReportScheduleDto } from '@packages/shared';

export class UpdateReportScheduleDto
  extends PartialType(CreateReportScheduleDto)
  implements IUpdateReportScheduleDto {}
