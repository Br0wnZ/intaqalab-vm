import { Router } from 'express';

import { armamentRouter } from './armament.route';
import { calendarRouter } from './calendar.routes';
import { documentsRouter } from './documents.routes';
import { eventLogRouter } from './event-log.routes';
import { executionRouter } from './execution.routes';
import { masterDataRouter } from './master-data.routes';
import { measuresRouter } from './measures.routes';
import { munitionsRouter } from './munitions.routes';
import { planningGeneralDataRouter } from './planning-general-data.routes';
import { trialsRouter } from './trials.routes';
import { whareHouseRouter } from './warehouse.routes';

const router = Router();

router.use('/centers', trialsRouter);
router.use('/centers', documentsRouter);
router.use('/centers', calendarRouter);
router.use('/centers', masterDataRouter);
router.use('/centers', whareHouseRouter);
router.use('/centers', executionRouter);
router.use('/centers/:centerId', munitionsRouter);
router.use('/centers/:centerId', armamentRouter);
router.use('/centers/:centerId', measuresRouter);
router.use('/', masterDataRouter);
router.use('/', planningGeneralDataRouter);
router.use('/centers', eventLogRouter);

export default router;
