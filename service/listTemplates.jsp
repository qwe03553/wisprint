<%@ page language="java" pageEncoding="UTF-8"
	contentType="text/html;charset=UTF-8"%>
<%@ page
	import="java.util.*,org.apache.commons.io.*,java.io.File,java.util.regex.*"%>
	<%
	response.setHeader("Cache-Control", "no-cache");
	response.setHeader("Pragma", "no-cache");
	response.setDateHeader("Expires", -1);
%>
<%
	// 取得可用的套打模板
	ServletContext context = pageContext.getServletContext();
	// 从模板文件读入模板数据,为演示方便，模板数据放在templates目录下
	File templates = new File(context.getRealPath("templates"));
	StringBuffer result = new StringBuffer();
	File[] lists = templates.listFiles();
	if (lists != null) {
		boolean first = true;
		for (File f : lists) {
			String name = f.getName();
			// 去掉临时的settingsID
			if (!name.endsWith(".tmp")) {
				String item = String.format("\"%s\"", name);
				if (!first) {
					item = "," + item;
				}
				result.append(item);
				first = false;
			}
		}
	}
%>
[<%=result.toString()%>]
